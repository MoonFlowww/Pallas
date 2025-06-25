import { NextResponse } from "next/server"
import { sql, marketSql } from "@/lib/db"
import { QueryResult } from "pg"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get("type") || "REAL"
    const days = parseInt(searchParams.get("days") || "180")

    await sql`SET statement_timeout = 20000`;
    
    console.log(`Fetching metrics for type: ${typeParam}, days: ${days}`);
    
    let tradesResult;
    
    try {
      if (typeParam !== "ALL") {
        console.log(`Using filtered query for type: ${typeParam}`);
        
        if (days > 0) {
      tradesResult = await sql`
            SELECT 
              id, date, type, biais, result, r, rr, hedge, risk, tp, sl, entry_price, exit_price, state
          FROM trades
          WHERE data = 'Trade'
          AND type = ${typeParam}
              AND date >= CURRENT_DATE - INTERVAL '${days} days'
            ORDER BY date DESC
            LIMIT 1000`;
        } else {
      tradesResult = await sql`
        SELECT 
              id, date, type, biais, result, r, rr, hedge, risk, tp, sl, entry_price, exit_price, state
          FROM trades
          WHERE data = 'Trade'
          AND type = ${typeParam}
            ORDER BY date DESC
            LIMIT 1000`;
        }
      } else {
        console.log(`Using ALL types query`);
        
        if (days > 0) {
      tradesResult = await sql`
        SELECT 
              id, date, type, biais, result, r, rr, hedge, risk, tp, sl, entry_price, exit_price, state
        FROM trades 
        WHERE data = 'Trade'
              AND date >= CURRENT_DATE - INTERVAL '${days} days'
            ORDER BY date DESC
            LIMIT 1000`;
        } else {
      tradesResult = await sql`
        SELECT 
              id, date, type, biais, result, r, rr, hedge, risk, tp, sl, entry_price, exit_price, state
            FROM trades
            WHERE data = 'Trade'
            ORDER BY date DESC
            LIMIT 1000`;
        }
      }
      
      console.log(`Query returned ${tradesResult.rows.length} trades`);
      
      if (tradesResult.rows.length > 0) {
        console.log('Sample trade data:');
        console.log(JSON.stringify(tradesResult.rows[0], null, 2));
      } else {
        console.log('No trades found - this will cause metrics to be zero');
        return NextResponse.json({
          success: true,
          metrics: {
            totalTrades: 0,
            tradingDays: 0,
            winRate: 0,
            totalReturn: 0,
            avgReturnPerTrade: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            sortinoRatio: 0,
            calmarRatio: 0,
            cagr: 0,
            beta: 0,
            alpha: 0,
            winning_days: 0,
            losing_days: 0,
            ftti: 0
          },
          chartData: {
            returns: [],
            minValue: 0,
            maxValue: 0,
            minCumulative: 0,
            maxCumulative: 0
          }
        });
      }
    } catch (dbError) {
      console.error("Database query error:", dbError);
      // Return a response with zeros instead of throwing
      return NextResponse.json({
        success: true,
        metrics: {
          totalTrades: 0,
          tradingDays: 0,
          winRate: 0,
          winRateTP: 0,
          totalReturn: 0,
          avgReturnPerTrade: 0,
          avgDailyReturn: 0,
          maxDrawdown: 0,
          avgDrawdown: 0,
          mad: 0,
          madDownside: 0,
          recoveryMDD: 0,
          recoveryDD: 0,
          sharpeRatio: 0,
          sortinoRatio: 0,
          calmarRatio: 0,
          cagr: 0,
          omegaRatio: 0,
          rachevRatio: 0,
          kellyCriterion: 0,
          upi: 0,
          ftti: 0,
          alpha: 0,
          beta: 0,
          correlation: 0,
          avgRisk: 0,
          avgHedge: 0,
          avgPositiveHedge: 0,
          winning_days: 0,
          losing_days: 0,
          var95: 0,
          cVaR95: 0,
          skew: 0,
          kurtosis: 0,
          kurtosisPositive: 0, 
          kurtosisNegative: 0,
          kurtosisRatio: 0,
          cornishFisher: 0
        },
        chartData: {
          returns: [],
          minValue: 0,
          maxValue: 0,
          minCumulative: 0,
          maxCumulative: 0
        },
        message: "Database query failed, using default values"
      });
    }

    const trades = tradesResult.rows.map((trade: any) => {
      let returnPercent = 0;
      try {
        returnPercent = parseFloat(trade.result || 0) * 100;
        if (isNaN(returnPercent)) {
          console.warn(`Invalid result value: ${trade.result}`);
          returnPercent = 0;
        }
      } catch (e) {
        console.error(`Error processing result: ${trade.result}`, e);
        returnPercent = 0;
      }
      
      let profit = 0;
      let loss = 0;
      
      if (returnPercent > 0) {
        profit = returnPercent;
      } else if (returnPercent < 0) {
        loss = Math.abs(returnPercent);
      }
      
      return {
        ...trade,
        biais: trade.biais || '',
        profit,
        loss,
        return_percent: returnPercent,
        rr: parseFloat(trade.rr || 0),
        r_value: parseFloat(trade.hedge || 0) < 0 
          ? parseFloat(trade.hedge || 0) 
          : parseFloat(trade.rr || 0) * parseFloat(trade.hedge || 0),
        risk: parseFloat(trade.risk || 0),
        hedge: parseFloat(trade.hedge || 0),
        state: trade.state || ''
      };
    });

    console.log(`Processed ${trades.length} trades for metrics calculation`);

    const dateMap = new Map();
    trades.forEach(trade => {
      const dateStr = new Date(trade.date).toISOString().split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          daily_return: 0,
          trades: []
        });
      }
      const dateData = dateMap.get(dateStr);
      dateData.daily_return += trade.return_percent;
      dateData.trades.push({
        id: trade.id,
        return_percent: trade.return_percent,
        type: trade.type,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price
      });
    });
    
    console.log(`Grouped trades into ${dateMap.size} trading days`);
    
    // Calculate MDD from individual trade returns
    let cumulative = 0;
    let maxDrawdown = 0;
    let peak = 0;
    let drawdowns: number[] = [];
    let drawdownSum = 0;
    let drawdownCount = 0;

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate MDD from individual trades
    sortedTrades.forEach(trade => {
      cumulative += trade.return_percent;
      
      if (cumulative > peak) {
        peak = cumulative;
      }
      const currentDrawdown = peak - cumulative;
      maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
      
      if (currentDrawdown > 0) {
        drawdowns.push(currentDrawdown);
        drawdownSum += currentDrawdown;
        drawdownCount++;
      }
    });

    console.log(`Calculated MDD from individual trades: ${maxDrawdown.toFixed(2)}%`);

    // Calculate daily returns for chart data
    const dailyReturns: {
      trade_date: string;
      daily_return: number;
      cumulative_return: number;
      trades: any[];
      trade_count: number;
    }[] = [];
    let dailyCumulative = 0;
    
    const sortedDates = Array.from(dateMap.keys()).sort();
    
    sortedDates.forEach(dateStr => {
      const day = dateMap.get(dateStr);
      dailyCumulative += day.daily_return;
      
      dailyReturns.push({
        trade_date: dateStr,
        daily_return: day.daily_return,
        cumulative_return: dailyCumulative,
        trades: day.trades,
        trade_count: day.trades.length
      });
    });
    
    console.log(`Calculated returns with peak: ${peak.toFixed(2)}%, max drawdown: ${maxDrawdown.toFixed(2)}%`);
    
    const totalTrades = trades.length;
    const tradingDays = dateMap.size;
    
    // Win Rate based on "TP" state (WR TP)
    const tpTrades = trades.filter(trade => trade.state === 'TP').length;
    const winRateTP = totalTrades > 0 ? (tpTrades / totalTrades) * 100 : 0;
    
    console.log(`Win rate based on TP state (WR TP): ${winRateTP.toFixed(2)}% (${tpTrades}/${totalTrades})`);
    
    // Win rate based on positive returns (WR)
    const positiveTrades = trades.filter(trade => trade.return_percent > 0).length;
    const winRate = totalTrades > 0 ? (positiveTrades / totalTrades) * 100 : 0;
    
    console.log(`Win rate based on positive returns (WR): ${winRate.toFixed(2)}% (${positiveTrades}/${totalTrades})`);
    
    const winningTrades = trades.filter(trade => trade.return_percent > 0);
    const losingTrades = trades.filter(trade => trade.return_percent < 0);
    
    const avgProfit = winningTrades.length > 0 
      ? winningTrades.reduce((sum, trade) => sum + trade.return_percent, 0) / winningTrades.length 
      : 0;
      
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.return_percent, 0) / losingTrades.length) 
      : 1; // Avoid division by zero
    
    console.log(`Average profit per winning trade: ${avgProfit.toFixed(2)}%, Average loss per losing trade: ${avgLoss.toFixed(2)}%`);

    const totalReturn = trades.reduce((sum, trade) => sum + trade.return_percent, 0);
    console.log(`Total return sum: ${totalReturn.toFixed(2)}%`);
    
    // ~R: Average return flat per trade
    const avgReturnPerTrade = totalTrades > 0 ? totalReturn / totalTrades : 0;
    const avgDailyReturn = tradingDays > 0 ? totalReturn / tradingDays : 0;
    
    const daysElapsed = sortedDates.length > 0 ? 
      (new Date(sortedDates[sortedDates.length-1]).getTime() - new Date(sortedDates[0]).getTime()) / (1000 * 60 * 60 * 24) + 1 : 
      1;
    const yearsElapsed = daysElapsed / 365;
    const tradesPerYear = totalTrades / yearsElapsed;
    const cagr = tradesPerYear > 0 ? 
      avgReturnPerTrade * tradesPerYear : 
      avgDailyReturn * 252; // Fallback
    
    console.log(`CAGR calculation: ${cagr.toFixed(2)}% based on ${tradesPerYear.toFixed(2)} trades/year`);
    
    const avgDrawdown = drawdownCount > 0 ? drawdownSum / drawdownCount : 0;
    console.log(`Average Drawdown (~DD): ${avgDrawdown.toFixed(2)}%`);
    
    const recoveryMDD = avgReturnPerTrade !== 0 ? maxDrawdown / Math.abs(avgReturnPerTrade) : 0;
    const recoveryDD = avgReturnPerTrade !== 0 ? avgDrawdown / Math.abs(avgReturnPerTrade) : 0;
    
    const returnValues = trades.map(trade => trade.return_percent);
    const meanReturn = avgReturnPerTrade;
    
    const mad = totalTrades > 0 
      ? returnValues.reduce((sum, val) => sum + Math.abs(val - meanReturn), 0) / totalTrades
      : 0;
    
    const downsideReturns = returnValues.filter(val => val < 0);
    const madDownside = downsideReturns.length > 0
      ? downsideReturns.reduce((sum, val) => sum + Math.abs(val), 0) / downsideReturns.length
      : 0;
    
    const calculateStdDev = (values: number[], mean: number): number => {
      if (values.length <= 1) return 0;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      return Math.sqrt(variance);
    };

    const calculateSkew = (values: number[], mean: number, stdDev: number): number => {
      if (values.length <= 2 || stdDev === 0) return 0;
      const sumCubedDeviations = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0);
      return sumCubedDeviations / values.length;
    };

    const calculateKurtosis = (values: number[], mean: number, stdDev: number): number => {
      if (values.length <= 3 || stdDev === 0) return 0;
      const sumQuarticDeviations = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0);
      return sumQuarticDeviations / values.length - 3; // Excess kurtosis (normal = 0)
    };

    // Calculate positive and negative side kurtosis
    const calculateSideKurtosis = (values: number[], mean: number, stdDev: number): { positive: number, negative: number } => {
      if (values.length <= 3 || stdDev === 0) return { positive: 0, negative: 0 };
      
      const positiveDeviations = values.filter(val => val > mean);
      const negativeDeviations = values.filter(val => val < mean);
      
      const posKurtosis = positiveDeviations.length > 3 
        ? positiveDeviations.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / positiveDeviations.length - 3
        : 0;
        
      const negKurtosis = negativeDeviations.length > 3
        ? negativeDeviations.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / negativeDeviations.length - 3
        : 0;
        
      return { positive: posKurtosis, negative: negKurtosis };
    };

    // Calculate Cornish-Fisher expansion for VaR
    const calculateCornishFisherVaR = (mean: number, stdDev: number, skew: number, kurtosis: number, confidence: number = 0.95): number => {
      const z = calculateNormalQuantile(1 - confidence);
      

      const z2 = z * z;
      const z3 = z2 * z;
      
      const cf = z + 
                (z2 - 1) * skew / 6 + 
                z * (z2 - 3) * kurtosis / 24 - 
                (2 * z3 - 5 * z) * skew * skew / 36;
                
      return -(mean + stdDev * cf);
    };
    
    // Helper function CDF
    const calculateNormalQuantile = (p: number): number => {
      // Approximation of the standard normal quantile function
      // method Abramowitz and Stegun approximation
      if (p <= 0) return -Infinity;
      if (p >= 1) return Infinity;
      
      let q = p - 0.5;
      if (Math.abs(q) <= 0.42) {
        const r = q * q;
        return q * ((((-25.44106049637 * r + 41.39119773534) * r - 18.61500062529) * r + 2.50662823884) / 
                   ((((3.13082909833 * r - 21.06224101826) * r + 23.08336743743) * r - 8.47351093090) * r + 1));
      }
      
      const r = p < 0.5 ? p : 1 - p;
      let s = Math.log(-Math.log(r));
      let t = 0.0;
      
      if (s >= 5.0) {
        t = 1.0 / s;
      } else if (s > 2.25) {
        t = 1.0 / (s + 0.5);
      } else if (s > 1.0) {
        t = 1.0 / (s + 1.0);
      } else {
        t = 1.0 / (s + 1.5);
      }
      
      let x = 0.0;
      
      if (s < 5.0) {
        if (s < 2.25) {
          s = s - 0.3;
        } else {
          s = s - 0.9;
        }
        
        x = (((0.05642 * t + 0.0124) * t + 0.05642) * t - 1.2406) * t + 1.0;
      } else {
        x = (((0.0082 * t + 0.0349) * t + 0.505) * t + 1.432) * t + 0.7967;
      }
      
      if (p < 0.5) return -x * s;
      return x * s;
    };

    const dailyReturnsValues = dailyReturns.map(day => day.daily_return);
    const meanDailyReturn = dailyReturnsValues.length > 0 ? 
      dailyReturnsValues.reduce((sum, val) => sum + val, 0) / dailyReturnsValues.length : 0;
    const stdDev = calculateStdDev(dailyReturnsValues, meanDailyReturn);

    const returnStdDev = calculateStdDev(returnValues, meanReturn);
    
    //asymmetry score
    const skew = calculateSkew(returnValues, meanReturn, returnStdDev);
    
    // Kurtosis + side and - side, with ratio of both
    const kurtosis = calculateKurtosis(returnValues, meanReturn, returnStdDev);
    const sideKurtosis = calculateSideKurtosis(returnValues, meanReturn, returnStdDev);
    const kurtosisRatio = sideKurtosis.negative !== 0 ? sideKurtosis.positive / -sideKurtosis.negative : 0;
    
    // Cornish-Fisher expensionb
    const cfe = calculateCornishFisherVaR(meanReturn, returnStdDev, skew, kurtosis);

    const downReturns = dailyReturnsValues.filter(val => val < 0);
    const downDeviation = downReturns.length > 0 ?
      Math.sqrt(downReturns.reduce((sum, val) => sum + Math.pow(val, 2), 0) / downReturns.length) : 0;

    const sharpeRatio = stdDev > 0 ? ((cagr/12) / stdDev) : 0;

    const sortinoRatio = downDeviation > 0 ? ((cagr/12) / downDeviation) : 0;

    const positiveReturns = trades.filter(trade => trade.return_percent > 0);
    const negativeReturns = trades.filter(trade => trade.return_percent < 0);
    
    const totalProfit = positiveReturns.reduce((sum, trade) => sum + trade.return_percent, 0);
    const totalLoss = Math.abs(negativeReturns.reduce((sum, trade) => sum + trade.return_percent, 0));
    const omegaRatio = totalLoss > 0 ? totalProfit / totalLoss : (totalProfit > 0 ? 999 : 0);

    const sortedReturns = [...returnValues].sort((a, b) => a - b);
    const var95threshold = Math.floor(sortedReturns.length * 0.05);
    
    // Calculate VaR (95%) using empirical method
    const var95 = var95threshold > 0 ? sortedReturns[var95threshold - 1] : 0;
    
    // Calculate CVaR (Expected Shortfall) - average of the worst 5% of returns
    const cVaR95 = var95threshold > 0 ?
      sortedReturns.slice(0, var95threshold).reduce((sum, val) => sum + val, 0) / var95threshold : 0;
      
    // Ensure CVaR is properly showing worse risk than VaR
    console.log(`VaR (95%): ${var95.toFixed(2)}%, CVaR (95%): ${cVaR95.toFixed(2)}%`);

    // Rachev ratio (using CVaR)
    const sortedPositiveReturns = positiveReturns.map(t => t.return_percent).sort((a, b) => b - a); // Descending
    const cVaR95positive = sortedPositiveReturns.length > 0 ?
      sortedPositiveReturns.slice(0, Math.floor(sortedPositiveReturns.length * 0.05))
        .reduce((sum, val) => sum + val, 0) / Math.max(1, Math.floor(sortedPositiveReturns.length * 0.05)) : 0;
    const rachevRatio = Math.abs(cVaR95) > 0 ? cVaR95positive / Math.abs(cVaR95) : 0;

    const ulcerIndex = drawdowns.length > 0 ?
      Math.sqrt(drawdowns.reduce((sum, dd) => sum + Math.pow(dd, 2), 0) / drawdowns.length) : 0;

    const upi = ulcerIndex > 0 ? (cagr/12) / ulcerIndex : 0;

    // Kelly Criterion (properly calculated with avg profit and loss)
    const winProb = winRate / 100;
    const lossProb = 1 - winProb;
    const winLossRatio = avgLoss > 0 ? avgProfit / avgLoss : 1;
    const kellyCriterion = winProb > 0 ? 
      (winProb - (lossProb / winLossRatio)) * 100 : 0;
    
    console.log(`Kelly Criterion calculation: Win prob: ${winProb.toFixed(4)}, Win/Loss ratio: ${winLossRatio.toFixed(2)}, Kelly: ${kellyCriterion.toFixed(2)}%`);
    
    // Risk metrics
    const avgRisk = trades.length > 0
      ? trades.reduce((sum, trade) => sum + trade.risk, 0) / trades.length
      : 0;
    
    const avgHedge = trades.length > 0
      ? trades.reduce((sum, trade) => sum + trade.hedge, 0) / trades.length
      : 0;
    
    const positiveHedgeTrades = trades.filter(trade => trade.hedge > 0);
    const avgPositiveHedge = positiveHedgeTrades.length > 0
      ? positiveHedgeTrades.reduce((sum, trade) => sum + trade.hedge, 0) / positiveHedgeTrades.length
      : 0;

    // Winning/losing days
    const winningDays = dailyReturns.filter(day => day.daily_return > 0).length;
    const losingDays = dailyReturns.filter(day => day.daily_return < 0).length;
    
    // Calculate FTTI (Fat Tail Toxicity Index)
    const calculateFTTI = (returns: number[]): number => {
      if (returns.length < 2) return 0;
      
      // Sort returns in descending order
      const sortedReturns = [...returns].sort((a, b) => b - a);
      
      // Calculate K+ (positive tail index) using top 10% of returns
      const kPlus = sortedReturns.slice(0, Math.floor(returns.length * 0.1))
        .reduce((sum, r) => sum + r, 0) / (returns.length * 0.1);
      
      // Calculate K- (negative tail index) using bottom 10% of returns
      const kMinus = sortedReturns.slice(-Math.floor(returns.length * 0.1))
        .reduce((sum, r) => sum + r, 0) / (returns.length * 0.1);
      
      // FTTI is the ratio of K+ to |K-|
      return kMinus !== 0 ? kPlus / Math.abs(kMinus) : 0;
    };

    // Calculate alpha/beta using EURUSD_tickdata
    const calculateAlphaBeta = async (startDate: Date, endDate: Date): Promise<{ alpha: number; beta: number; correlation: number }> => {
      try {
        // Find min/max dates in the database to avoid querying too much data
        const dateRangeResult = await marketSql`
          SELECT 
            MIN(date) as min_date,
            MAX(date) as max_date
          FROM EURUSD_tickdata`;
        
        // If no data exists, return zeroes
        if (!dateRangeResult.rows || dateRangeResult.rows.length === 0) {
          console.log("No EURUSD_tickdata found in database");
          return { alpha: 0, beta: 0, correlation: 0 };
        }
        
        // Scale the date range to ensure we stay within available data
        const dbMinDate = new Date(dateRangeResult.rows[0].min_date);
        const dbMaxDate = new Date(dateRangeResult.rows[0].max_date);
        
        // Use the later of startDate or dbMinDate, and earlier of endDate or dbMaxDate
        const queryStartDate = startDate < dbMinDate ? dbMinDate : startDate;
        const queryEndDate = endDate > dbMaxDate ? dbMaxDate : endDate;
        
        console.log(`Using EURUSD data range: ${queryStartDate.toISOString()} - ${queryEndDate.toISOString()}`);
        
        // Get EURUSD tick data for the scaled period
        const tickData = await marketSql`
          SELECT 
            date,
            (ask + bid) / 2 as price
          FROM EURUSD_tickdata
          WHERE date BETWEEN ${queryStartDate} AND ${queryEndDate}
          ORDER BY date ASC`;

        if (!tickData.rows || tickData.rows.length < 2) {
          console.log("Insufficient EURUSD tick data for alpha/beta calculation");
          return { alpha: 0, beta: 0, correlation: 0 };
        }

        // Calculate daily returns for EURUSD
        const marketReturns = [];
        for (let i = 1; i < tickData.rows.length; i++) {
          const prevPrice = tickData.rows[i - 1].price;
          const currPrice = tickData.rows[i].price;
          marketReturns.push((currPrice - prevPrice) / prevPrice);
        }

        if (marketReturns.length < 2) {
          console.log("Insufficient market returns for alpha/beta calculation");
          return { alpha: 0, beta: 0, correlation: 0 };
        }

        // Calculate strategy returns (from trades)
        // Create a map of dates to returns for faster lookup
        const tradeReturnsMap = new Map();
        trades.forEach(trade => {
          const dateStr = new Date(trade.date).toISOString().split('T')[0];
          if (!tradeReturnsMap.has(dateStr)) {
            tradeReturnsMap.set(dateStr, 0);
          }
          tradeReturnsMap.set(dateStr, tradeReturnsMap.get(dateStr) + trade.return_percent / 100);
        });
        
        // Match market dates with strategy dates
        const strategyReturns = [];
        const marketDates = [];
        for (let i = 1; i < tickData.rows.length; i++) {
          const date = new Date(tickData.rows[i].date);
          const dateStr = date.toISOString().split('T')[0];
          marketDates.push(dateStr);
          const returnValue = tradeReturnsMap.has(dateStr) ? tradeReturnsMap.get(dateStr) : 0;
          strategyReturns.push(returnValue);
        }

        // Only continue if we have sufficient data points
        if (strategyReturns.length < 2) {
          console.log("Insufficient strategy returns for alpha/beta calculation");
          return { alpha: 0, beta: 0, correlation: 0 };
        }

        // Calculate beta using covariance
        const covariance = calculateCovariance(strategyReturns, marketReturns);
        const marketVariance = calculateVariance(marketReturns);
        const beta = marketVariance !== 0 ? covariance / marketVariance : 0;

        // Calculate alpha (annualized)
        const strategyMean = calculateMean(strategyReturns);
        const marketMean = calculateMean(marketReturns);
        // Alpha is excess return over what would be predicted by the market
        const alpha = (strategyMean - (beta * marketMean)) * 252; // Annualize the alpha (252 trading days)

        // Calculate correlation
        const correlation = covariance / (Math.sqrt(calculateVariance(strategyReturns)) * Math.sqrt(marketVariance));

        return { alpha, beta, correlation };
      } catch (error) {
        console.error("Error calculating alpha/beta:", error);
        return { alpha: 0, beta: 0, correlation: 0 };
      }
    };

    // Helper functions for alpha/beta calculation
    const calculateCovariance = (x: number[], y: number[]): number => {
      if (x.length !== y.length) return 0;
      
      const xMean = calculateMean(x);
      const yMean = calculateMean(y);
      
      return x.reduce((sum, xi, i) => 
        sum + (xi - xMean) * (y[i] - yMean), 0) / x.length;
    };

    const calculateVariance = (values: number[]): number => {
      const mean = calculateMean(values);
      return values.reduce((sum, val) => 
        sum + Math.pow(val - mean, 2), 0) / values.length;
    };

    const calculateMean = (values: number[]): number => {
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    };

    // Calculate FTTI
    const ftti = calculateFTTI(returnValues);

    // Calculate alpha/beta/correlation
    const { alpha, beta, correlation } = await calculateAlphaBeta(
      new Date(sortedDates[0]),
      new Date(sortedDates[sortedDates.length - 1])
    );

    // Assemble metrics object with debugging
    const metrics = {
      totalTrades,
      tradingDays,
      winRateTP,     
      winRate,       // WR +R
      totalReturn,
      avgReturnPerTrade, // ~R
      avgDailyReturn,
      maxDrawdown,
      avgDrawdown,   // ~DD
      mad,
      madDownside,
      recoveryMDD,   // Recovery MDD
      recoveryDD,    // Recovery ~DD
      sharpeRatio,
      sortinoRatio,
      calmarRatio: maxDrawdown > 0 ? (cagr/12) / maxDrawdown : 0,
      cagr,
      omegaRatio,    // Profit Factor
      rachevRatio,   // Rachev Ratio
      kellyCriterion,
      upi,
      ftti,          // Fat Tail Toxicity Index
      alpha,         // Alpha (excess returns)
      beta,          // Beta (market sensitivity)
      correlation,   // Correlation with market
      avgRisk,
      avgHedge,
      avgPositiveHedge,
      winning_days: winningDays || 0,
      losing_days: losingDays || 0,
      var95,         // Value at Risk (95%)
      cVaR95,        // Conditional VaR/Expected Shortfall
      skew,
      kurtosis,
      kurtosisPositive: sideKurtosis.positive,
      kurtosisNegative: sideKurtosis.negative,
      kurtosisRatio,
      cornishFisher: cfe
    };
    
    console.log("Calculated metrics:", JSON.stringify(metrics, null, 2));

    return NextResponse.json({
      success: true,
      metrics,
      chartData: {
        returns: dailyReturns,
        minValue: dailyReturns.length > 0 ? Math.min(...dailyReturns.map(d => d.daily_return || 0), 0) : 0,
        maxValue: dailyReturns.length > 0 ? Math.max(...dailyReturns.map(d => d.daily_return || 0), 0) : 0,
        minCumulative: dailyReturns.length > 0 ? Math.min(...dailyReturns.map(d => d.cumulative_return || 0), 0) : 0,
        maxCumulative: dailyReturns.length > 0 ? Math.max(...dailyReturns.map(d => d.cumulative_return || 0), 0) : 0
      }
    });
  } catch (error) {
    console.error("Error calculating performance metrics:", error);
    return NextResponse.json({
      success: true,
      metrics: {
        totalTrades: 0,
        tradingDays: 0,
        winRate: 0,
        winRateTP: 0,
        totalReturn: 0,
        avgReturnPerTrade: 0,
        avgDailyReturn: 0,
        maxDrawdown: 0,
        avgDrawdown: 0,
        mad: 0,
        madDownside: 0,
        recoveryMDD: 0,
        recoveryDD: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        cagr: 0,
        omegaRatio: 0,
        rachevRatio: 0,
        kellyCriterion: 0,
        upi: 0,
        ftti: 0,
        alpha: 0,
        beta: 0,
        correlation: 0,
        avgRisk: 0,
        avgHedge: 0,
        avgPositiveHedge: 0,
        winning_days: 0,
        losing_days: 0,
        var95: 0,
        cVaR95: 0,
        skew: 0,
        kurtosis: 0,
        kurtosisPositive: 0, 
        kurtosisNegative: 0,
        kurtosisRatio: 0,
        cornishFisher: 0
      },
      chartData: {
        returns: [],
        minValue: 0,
        maxValue: 0,
        minCumulative: 0,
        maxCumulative: 0
      },
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
} 