import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { QueryResult } from "pg" // Import the PostgreSQL QueryResult type
import { log2 } from "mathjs"; // Add dependency for log function

interface TimeframeRow {
  trade_date: string
  nb: number
  profit_r: number
  loss_r: number
  pnl_r: number
  pos_trades: number
  neg_trades: number
  return_percent: number
  avg_risk: number
  avg_hedge: number
  avg_positive_hedge: number
  [key: string]: any  // For any additional properties
}

function calculateWilcoxonPValue(periodReturns: number[], allReturns: number[]): number {
  if (periodReturns.length < 2 || allReturns.length < 2) return 0;

  // Calculate the MLE (mean) of the complete dataset
  const mle = allReturns.reduce((sum, val) => sum + val, 0) / allReturns.length;

  // Calculate differences from MLE for the period returns
  const differences = periodReturns.map(r => r - mle);

  // Sort absolute differences and assign ranks
  const sortedDiffs = differences.map((diff, index) => ({
    value: Math.abs(diff),
    originalIndex: index,
    sign: Math.sign(diff)
  })).sort((a, b) => a.value - b.value);

  // Assign ranks, handling ties
  let currentRank = 1;
  let currentValue = sortedDiffs[0].value;
  let tiedCount = 0;
  let rankSum = 0;

  sortedDiffs.forEach((diff, index) => {
    if (diff.value === currentValue) {
      tiedCount++;
      rankSum += currentRank;
    } else {
      // Handle previous ties
      if (tiedCount > 0) {
        const averageRank = rankSum / tiedCount;
        for (let i = index - tiedCount; i < index; i++) {
          sortedDiffs[i].value = averageRank;
        }
      }
      currentRank = index + 1;
      currentValue = diff.value;
      tiedCount = 1;
      rankSum = currentRank;
    }
  });

  // Handle last group of ties
  if (tiedCount > 0) {
    const averageRank = rankSum / tiedCount;
    for (let i = sortedDiffs.length - tiedCount; i < sortedDiffs.length; i++) {
      sortedDiffs[i].value = averageRank;
    }
  }

  // Calculate W+ and W- statistics
  let wPlus = 0;
  let wMinus = 0;

  sortedDiffs.forEach(diff => {
    if (diff.sign > 0) {
      wPlus += diff.value;
    } else if (diff.sign < 0) {
      wMinus += diff.value;
    }
  });

  // Use the smaller of W+ and W- for the test statistic
  const w = Math.min(wPlus, wMinus);

  // Calculate expected value and standard deviation under null hypothesis
  const n = periodReturns.length;
  const expectedW = (n * (n + 1)) / 4;
  const stdDevW = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);

  // Calculate z-score
  const z = (w - expectedW) / stdDevW;

  // Calculate two-tailed p-value using normal approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  return pValue;
}

function erf(x: number): number {
  // Approximation of the error function
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0/(1.0 + p*x);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
  return sign * y;
}

function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function processTimeframeData(data: any[]) {
  // Collect all returns for MLE calculation
  const allReturns = data.flatMap(period => 
    period.returns.filter((r: number) => r !== null && !isNaN(r))
  );

  return data.map(period => {
    const returns = period.returns.filter((r: number) => r !== null && !isNaN(r));
    const pValue = calculateWilcoxonPValue(returns, allReturns);

    return {
      date: period.date,
      nb: period.nb,
      profitR: period.profitR,
      lossR: period.lossR,
      pnlR: period.pnlR,
      ratioR: period.ratioR,
      posTrades: period.posTrades,
      negTrades: period.negTrades,
      ordersWinRate: period.ordersWinRate,
      gainHedge: period.gainHedge,
      hedgePosTrades: period.hedgePosTrades,
      wr: period.wr,
      avgWeightedRisk: period.avgWeightedRisk,
      q1Return: period.q1Return,
      q2Return: period.q2Return,
      q3Return: period.q3Return,
      q4Return: period.q4Return,
      flatPercent: period.flatPercent,
      gainPercent: period.gainPercent,
      lossPercent: period.lossPercent,
      capitalChange: period.capitalChange,
      capitalEndPeriod: period.capitalEndPeriod,
      compoundReturn: period.compoundReturn,
      ddEnd: period.ddEnd,
      mddPeriod: period.mddPeriod,
      returnPerTrade: period.returnPerTrade,
      ulcerIndex: period.ulcerIndex,
      upi: period.upi,
      wilcoxonPValue: pValue
    };
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get("type") || "REAL"
    
    // Add statement timeout to prevent long-running queries
    await sql`SET statement_timeout = 20000`;
    
    let dailyResult: { rows: TimeframeRow[] } = { rows: [] };
    let weeklyResult: { rows: TimeframeRow[] } = { rows: [] };
    let monthlyResult: { rows: TimeframeRow[] } = { rows: [] };
    let quarterlyResult: { rows: TimeframeRow[] } = { rows: [] };
    let annualResult: { rows: TimeframeRow[] } = { rows: [] };

    // Update the processTimeframeData function to properly calculate p-value
    const processTimeframeData = (rows: any[]) => {
      if (!rows || rows.length === 0) return [];
      
      // First get all returns for Wilcoxon calculation
      const allReturns = rows.map(row => Number(row.pnl_r || 0)).filter(val => !isNaN(val));
      
      // Calculate MLE distribution parameters
      const mleMean = allReturns.reduce((sum, val) => sum + val, 0) / allReturns.length;
      const mleStdDev = Math.sqrt(
        allReturns.reduce((sum, val) => sum + Math.pow(val - mleMean, 2), 0) / allReturns.length
      );
      
      // Sort the data by date (chronologically)
      const sortedRows = [...rows].sort((a, b) => 
        new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
      );
      
      // Process each row independently
      const processedData = sortedRows.map((row: any) => {
        const totalTrades = Number(row.nb || 0)
        const posTrades = Number(row.pos_trades || 0)
        const negTrades = Number(row.neg_trades || 0)
        const tpTrades = Number(row.tp_trades || 0)
        
        // This is the period's return (for this specific cluster/timeframe)
        const pnlR = Number(row.pnl_r || 0)
        const profitR = Number(row.profit_r || 0)
        const lossR = Number(row.loss_r || 0)
        
        // Return percent from the compound_return calculation
        const returnPercent = Number(row.compound_return || 0)
        
        // Calculate metrics for this individual cluster only
        const currentDrawdown = lossR > 0 ? lossR : 0;
        const maxDrawdown = currentDrawdown;
        
        const ulcerIndex = Math.sqrt(currentDrawdown * currentDrawdown);
        const upi = ulcerIndex > 0 ? returnPercent / ulcerIndex : 0;
        
        // Calculate average return per trade for this period
        const avgReturnPerTrade = totalTrades > 0 ? pnlR / totalTrades : 0;
        
        // Calculate p-value comparing period's avg return per trade to MLE distribution
        let pValue = 1.0; // Default value (no statistical significance)
        
        if (totalTrades > 0 && mleStdDev > 0) {
          // Calculate z-score of the period's average return compared to MLE distribution
          const zScore = (avgReturnPerTrade - mleMean) / (mleStdDev / Math.sqrt(totalTrades));
          
          // Convert z-score to p-value (two-tailed test)
          pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
        }
        
        const recovery = avgReturnPerTrade !== 0 ? maxDrawdown / Math.abs(avgReturnPerTrade) : 0;
        
        return {
          date: row.trade_date,
          nb: totalTrades,
          profitR,
          lossR,
          pnlR,
          ratioR: lossR > 0 ? profitR / lossR : 0,
          posTrades,
          negTrades,
          ordersWinRate: totalTrades > 0 ? (tpTrades / totalTrades) * 100 : 0,
          gainRate: totalTrades > 0 ? (posTrades / totalTrades) * 100 : 0,
          risk: Number(row.avg_risk || 0),
          hedge: Number(row.avg_hedge || 0),
          positiveHedge: Number(row.avg_positive_hedge || 0),
          wr: totalTrades > 0 ? (posTrades / totalTrades) * 100 : 0,
          avgWeightedRisk: Number(row.avg_risk || 0),
          flatPercent: pnlR,
          gainPercent: totalTrades > 0 ? (posTrades / totalTrades) * 100 : 0,
          lossPercent: totalTrades > 0 ? (negTrades / totalTrades) * 100 : 0,
          capitalChange: returnPercent,
          capitalEndPeriod: returnPercent,
          compoundReturn: returnPercent,
          ddEnd: currentDrawdown,
          mddPeriod: maxDrawdown,
          recovery,
          returnPerTrade: avgReturnPerTrade,
          ulcerIndex,
          upi,
          wilcoxonPValue: pValue // Using the new p-value calculation
        }
      });
      
      // Return the data with newest on top (reverse chronological)
      return processedData.reverse();
    }
    
    // Execute each timeframe query separately to avoid overloading the database
    try {
      // Daily data
      dailyResult = typeParam !== "ALL"
        ? await sql`
            SELECT 
              DATE(date) AS trade_date,
              COUNT(*) AS nb,
              SUM(CASE WHEN result > 0 THEN result ELSE 0 END) AS profit_r,
              SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END) AS loss_r,
              ROUND((SUM(r))::NUMERIC, 3) AS pnl_r,
              SUM(CASE WHEN result > 0 THEN 1 ELSE 0 END) AS pos_trades,
              SUM(CASE WHEN result < 0 THEN 1 ELSE 0 END) AS neg_trades,
              SUM(CASE WHEN state = 'TP' THEN 1 ELSE 0 END) AS tp_trades,
              AVG(CASE WHEN risk < 1 THEN risk ELSE NULL END) AS avg_risk,
              ROUND((SUM(r)/ NULLIF(SUM(rr), 0))::NUMERIC, 3) AS avg_hedge,
              ROUND((SUM(CASE WHEN r > 0 THEN r ELSE 0 END)/ NULLIF(SUM(CASE WHEN r > 0 THEN rr ELSE 0 END), 0))::NUMERIC, 3) AS avg_positive_hedge,
              ROUND(((EXP(SUM(LN(CASE WHEN 1 + result > 0 THEN 1 + result ELSE NULL END))) - 1) * 100)::NUMERIC, 2) AS compound_return
            FROM trades 
            WHERE type = ${typeParam} AND data = 'Trade'
              AND result IS NOT NULL
              AND result > -1
            GROUP BY DATE(date)
            ORDER BY DATE(date) DESC
            LIMIT 100`
        : await sql`
            SELECT 
              DATE(date) AS trade_date,
              COUNT(*) AS nb,
              SUM(CASE WHEN result > 0 THEN result ELSE 0 END) AS profit_r,
              SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END) AS loss_r,
              ROUND((SUM(r))::NUMERIC, 3) AS pnl_r,
              SUM(CASE WHEN result > 0 THEN 1 ELSE 0 END) AS pos_trades,
              SUM(CASE WHEN result < 0 THEN 1 ELSE 0 END) AS neg_trades,
              SUM(CASE WHEN state = 'TP' THEN 1 ELSE 0 END) AS tp_trades,
              AVG(CASE WHEN risk < 1 THEN risk ELSE NULL END) AS avg_risk,
              ROUND((SUM(r)/ NULLIF(SUM(rr), 0))::NUMERIC, 3) AS avg_hedge,
              ROUND((SUM(CASE WHEN r > 0 THEN r ELSE 0 END)/ NULLIF(SUM(CASE WHEN r > 0 THEN rr ELSE 0 END), 0))::NUMERIC, 3) AS avg_positive_hedge,
              ROUND(((EXP(SUM(LN(CASE WHEN 1 + result > 0 THEN 1 + result ELSE NULL END))) - 1) * 100)::NUMERIC, 2) AS compound_return
            FROM trades 
            WHERE data = 'Trade'
              AND result IS NOT NULL
              AND result > -1
            GROUP BY DATE(date)
            ORDER BY DATE(date) DESC
            LIMIT 100`;
      
      // Now fetch weekly data
      weeklyResult = typeParam !== "ALL" 
        ? await sql`
            SELECT 
              DATE_TRUNC('week', date)::DATE AS trade_date,
              COUNT(*) AS nb,
              SUM(CASE WHEN result > 0 THEN result ELSE 0 END) AS profit_r,
              SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END) AS loss_r,
              ROUND((SUM(r))::NUMERIC, 3) AS pnl_r,
              SUM(CASE WHEN result > 0 THEN 1 ELSE 0 END) AS pos_trades,
              SUM(CASE WHEN result < 0 THEN 1 ELSE 0 END) AS neg_trades,
              SUM(CASE WHEN state = 'TP' THEN 1 ELSE 0 END) AS tp_trades,
              AVG(CASE WHEN risk < 1 THEN risk ELSE NULL END) AS avg_risk,
              ROUND((SUM(r)/ NULLIF(SUM(rr), 0))::NUMERIC, 3) AS avg_hedge,
              ROUND((SUM(CASE WHEN r > 0 THEN r ELSE 0 END)/ NULLIF(SUM(CASE WHEN r > 0 THEN rr ELSE 0 END), 0))::NUMERIC, 3) AS avg_positive_hedge,
              ROUND(((EXP(SUM(LN(CASE WHEN 1 + result > 0 THEN 1 + result ELSE NULL END))) - 1) * 100)::NUMERIC, 2) AS compound_return
            FROM trades 
            WHERE type = ${typeParam} AND data = 'Trade'
              AND result IS NOT NULL
              AND result > -1
            GROUP BY DATE_TRUNC('week', date)
            ORDER BY DATE_TRUNC('week', date) DESC
            LIMIT 52`
        : await sql`
            SELECT 
              DATE_TRUNC('week', date)::DATE AS trade_date,
              COUNT(*) AS nb,
              SUM(CASE WHEN result > 0 THEN result ELSE 0 END) AS profit_r,
              SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END) AS loss_r,
              ROUND((SUM(r))::NUMERIC, 3) AS pnl_r,
              SUM(CASE WHEN result > 0 THEN 1 ELSE 0 END) AS pos_trades,
              SUM(CASE WHEN result < 0 THEN 1 ELSE 0 END) AS neg_trades,
              SUM(CASE WHEN state = 'TP' THEN 1 ELSE 0 END) AS tp_trades,
              AVG(CASE WHEN risk < 1 THEN risk ELSE NULL END) AS avg_risk,
              ROUND((SUM(r)/ NULLIF(SUM(rr), 0))::NUMERIC, 3) AS avg_hedge,
              ROUND((SUM(CASE WHEN r > 0 THEN r ELSE 0 END)/ NULLIF(SUM(CASE WHEN r > 0 THEN rr ELSE 0 END), 0))::NUMERIC, 3) AS avg_positive_hedge,
              ROUND(((EXP(SUM(LN(CASE WHEN 1 + result > 0 THEN 1 + result ELSE NULL END))) - 1) * 100)::NUMERIC, 2) AS compound_return
            FROM trades 
            WHERE data = 'Trade'
              AND result IS NOT NULL
              AND result > -1
            GROUP BY DATE_TRUNC('week', date)
            ORDER BY DATE_TRUNC('week', date) DESC
            LIMIT 52`;
      
      // Monthly data
      monthlyResult = typeParam !== "ALL"
        ? await sql`
            SELECT 
              DATE_TRUNC('month', date)::DATE AS trade_date,
              COUNT(*) AS nb,
              SUM(CASE WHEN result > 0 THEN result ELSE 0 END) AS profit_r,
              SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END) AS loss_r,
              ROUND((SUM(r))::NUMERIC, 3) AS pnl_r,
              SUM(CASE WHEN result > 0 THEN 1 ELSE 0 END) AS pos_trades,
              SUM(CASE WHEN result < 0 THEN 1 ELSE 0 END) AS neg_trades,
              SUM(CASE WHEN state = 'TP' THEN 1 ELSE 0 END) AS tp_trades,
              AVG(CASE WHEN risk < 1 THEN risk ELSE NULL END) AS avg_risk,
              ROUND((SUM(r)/ NULLIF(SUM(rr), 0))::NUMERIC, 3) AS avg_hedge,
              ROUND((SUM(CASE WHEN r > 0 THEN r ELSE 0 END)/ NULLIF(SUM(CASE WHEN r > 0 THEN rr ELSE 0 END), 0))::NUMERIC, 3) AS avg_positive_hedge,
              ROUND(((EXP(SUM(LN(CASE WHEN 1 + result > 0 THEN 1 + result ELSE NULL END))) - 1) * 100)::NUMERIC, 2) AS compound_return
            FROM trades 
            WHERE type = ${typeParam} AND data = 'Trade'
              AND result IS NOT NULL
              AND result > -1
            GROUP BY DATE_TRUNC('month', date)
            ORDER BY DATE_TRUNC('month', date) DESC
            LIMIT 24`
        : await sql`
            SELECT 
              DATE_TRUNC('month', date)::DATE AS trade_date,
              COUNT(*) AS nb,
              SUM(CASE WHEN result > 0 THEN result ELSE 0 END) AS profit_r,
              SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END) AS loss_r,
              ROUND((SUM(r))::NUMERIC, 3) AS pnl_r,
              SUM(CASE WHEN result > 0 THEN 1 ELSE 0 END) AS pos_trades,
              SUM(CASE WHEN result < 0 THEN 1 ELSE 0 END) AS neg_trades,
              SUM(CASE WHEN state = 'TP' THEN 1 ELSE 0 END) AS tp_trades,
              AVG(CASE WHEN risk < 1 THEN risk ELSE NULL END) AS avg_risk,
              ROUND((SUM(r)/ NULLIF(SUM(rr), 0))::NUMERIC, 3) AS avg_hedge,
              ROUND((SUM(CASE WHEN r > 0 THEN r ELSE 0 END)/ NULLIF(SUM(CASE WHEN r > 0 THEN rr ELSE 0 END), 0))::NUMERIC, 3) AS avg_positive_hedge,
              ROUND(((EXP(SUM(LN(CASE WHEN 1 + result > 0 THEN 1 + result ELSE NULL END))) - 1) * 100)::NUMERIC, 2) AS compound_return
            FROM trades 
            WHERE data = 'Trade'
              AND result IS NOT NULL
              AND result > -1
            GROUP BY DATE_TRUNC('month', date)
            ORDER BY DATE_TRUNC('month', date) DESC
            LIMIT 24`;
      
      // Quarterly data
      quarterlyResult = typeParam !== "ALL"
        ? await sql`
            SELECT 
              DATE_TRUNC('quarter', date)::DATE AS trade_date,
              COUNT(*) AS nb,
              SUM(CASE WHEN result > 0 THEN result ELSE 0 END) AS profit_r,
              SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END) AS loss_r,
              ROUND((SUM(r))::NUMERIC, 3) AS pnl_r,
              SUM(CASE WHEN result > 0 THEN 1 ELSE 0 END) AS pos_trades,
              SUM(CASE WHEN result < 0 THEN 1 ELSE 0 END) AS neg_trades,
              SUM(CASE WHEN state = 'TP' THEN 1 ELSE 0 END) AS tp_trades,
              AVG(CASE WHEN risk < 1 THEN risk ELSE NULL END) AS avg_risk,
              ROUND((SUM(r)/ NULLIF(SUM(rr), 0))::NUMERIC, 3) AS avg_hedge,
              ROUND((SUM(CASE WHEN r > 0 THEN r ELSE 0 END)/ NULLIF(SUM(CASE WHEN r > 0 THEN rr ELSE 0 END), 0))::NUMERIC, 3) AS avg_positive_hedge,
              ROUND(((EXP(SUM(LN(CASE WHEN 1 + result > 0 THEN 1 + result ELSE NULL END))) - 1) * 100)::NUMERIC, 2) AS compound_return
            FROM trades 
            WHERE type = ${typeParam} AND data = 'Trade'
              AND result IS NOT NULL
              AND result > -1
            GROUP BY DATE_TRUNC('quarter', date)
            ORDER BY DATE_TRUNC('quarter', date) DESC
            LIMIT 16`
        : await sql`
            SELECT 
              DATE_TRUNC('quarter', date)::DATE AS trade_date,
              COUNT(*) AS nb,
              SUM(CASE WHEN result > 0 THEN result ELSE 0 END) AS profit_r,
              SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END) AS loss_r,
              ROUND((SUM(r))::NUMERIC, 3) AS pnl_r,
              SUM(CASE WHEN result > 0 THEN 1 ELSE 0 END) AS pos_trades,
              SUM(CASE WHEN result < 0 THEN 1 ELSE 0 END) AS neg_trades,
              SUM(CASE WHEN state = 'TP' THEN 1 ELSE 0 END) AS tp_trades,
              AVG(CASE WHEN risk < 1 THEN risk ELSE NULL END) AS avg_risk,
              ROUND((SUM(r)/ NULLIF(SUM(rr), 0))::NUMERIC, 3) AS avg_hedge,
              ROUND((SUM(CASE WHEN r > 0 THEN r ELSE 0 END)/ NULLIF(SUM(CASE WHEN r > 0 THEN rr ELSE 0 END), 0))::NUMERIC, 3) AS avg_positive_hedge,
              ROUND(((EXP(SUM(LN(CASE WHEN 1 + result > 0 THEN 1 + result ELSE NULL END))) - 1) * 100)::NUMERIC, 2) AS compound_return
            FROM trades 
            WHERE data = 'Trade'
              AND result IS NOT NULL
              AND result > -1
            GROUP BY DATE_TRUNC('quarter', date)
            ORDER BY DATE_TRUNC('quarter', date) DESC
            LIMIT 16`;
      
      // Annual data
      annualResult = typeParam !== "ALL"
        ? await sql`
            SELECT 
              DATE_TRUNC('year', date)::DATE AS trade_date,
              COUNT(*) AS nb,
              SUM(CASE WHEN result > 0 THEN result ELSE 0 END) AS profit_r,
              SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END) AS loss_r,
              ROUND((SUM(r))::NUMERIC, 3) AS pnl_r,
              SUM(CASE WHEN result > 0 THEN 1 ELSE 0 END) AS pos_trades,
              SUM(CASE WHEN result < 0 THEN 1 ELSE 0 END) AS neg_trades,
              SUM(CASE WHEN state = 'TP' THEN 1 ELSE 0 END) AS tp_trades,
              AVG(CASE WHEN risk < 1 THEN risk ELSE NULL END) AS avg_risk,
              ROUND((SUM(r)/ NULLIF(SUM(rr), 0))::NUMERIC, 3) AS avg_hedge,
              ROUND((SUM(CASE WHEN r > 0 THEN r ELSE 0 END)/ NULLIF(SUM(CASE WHEN r > 0 THEN rr ELSE 0 END), 0))::NUMERIC, 3) AS avg_positive_hedge,
              ROUND(((EXP(SUM(LN(CASE WHEN 1 + result > 0 THEN 1 + result ELSE NULL END))) - 1) * 100)::NUMERIC, 2) AS compound_return
            FROM trades 
            WHERE type = ${typeParam} AND data = 'Trade'
              AND result IS NOT NULL
              AND result > -1
            GROUP BY DATE_TRUNC('year', date)
            ORDER BY DATE_TRUNC('year', date) DESC
            LIMIT 10`
        : await sql`
            SELECT 
              DATE_TRUNC('year', date)::DATE AS trade_date,
              COUNT(*) AS nb,
              SUM(CASE WHEN result > 0 THEN result ELSE 0 END) AS profit_r,
              SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END) AS loss_r,
              ROUND((SUM(r))::NUMERIC, 3) AS pnl_r,
              SUM(CASE WHEN result > 0 THEN 1 ELSE 0 END) AS pos_trades,
              SUM(CASE WHEN result < 0 THEN 1 ELSE 0 END) AS neg_trades,
              SUM(CASE WHEN state = 'TP' THEN 1 ELSE 0 END) AS tp_trades,
              AVG(CASE WHEN risk < 1 THEN risk ELSE NULL END) AS avg_risk,
              ROUND((SUM(r)/ NULLIF(SUM(rr), 0))::NUMERIC, 3) AS avg_hedge,
              ROUND((SUM(CASE WHEN r > 0 THEN r ELSE 0 END)/ NULLIF(SUM(CASE WHEN r > 0 THEN rr ELSE 0 END), 0))::NUMERIC, 3) AS avg_positive_hedge,
              ROUND(((EXP(SUM(LN(CASE WHEN 1 + result > 0 THEN 1 + result ELSE NULL END))) - 1) * 100)::NUMERIC, 2) AS compound_return
            FROM trades 
            WHERE data = 'Trade'
              AND result IS NOT NULL
              AND result > -1
            GROUP BY DATE_TRUNC('year', date)
            ORDER BY DATE_TRUNC('year', date) DESC
            LIMIT 10`;
      
      return NextResponse.json({
        success: true,
        timeframes: {
          daily: processTimeframeData(dailyResult.rows),
          weekly: processTimeframeData(weeklyResult.rows),
          monthly: processTimeframeData(monthlyResult.rows),
          quarterly: processTimeframeData(quarterlyResult.rows),
          annually: processTimeframeData(annualResult.rows)
        }
      });
    } catch (dbError) {
      console.error("Database query error:", dbError);
      
      // Return a simplified fallback response with empty data
      return NextResponse.json({
        success: true,
        timeframes: {
          daily: [],
          weekly: [],
          monthly: [],
          quarterly: [],
          annually: []
        },
        message: "Using fallback data due to database timeout"
      });
    }
  } catch (error) {
    console.error("Error fetching timeframe data:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
} 