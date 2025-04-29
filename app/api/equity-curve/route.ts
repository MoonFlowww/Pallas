import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { QueryResult } from "pg" // Import the PostgreSQL QueryResult type

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get("type") || "REAL"
    const days = parseInt(searchParams.get("days") || "180")
    
    // Handle specific days cases with hardcoded intervals
    let dailyReturnsResult: QueryResult;
    
    // Set timeout properly using sql template literal directly
    await sql`SET statement_timeout = 10000`

    // Type filter cases
    if (typeParam !== "ALL") {
      if (days === 30) {
        dailyReturnsResult = await sql`
          WITH daily_returns AS (
            SELECT 
              DATE(date) as trade_date,
              SUM(result) as daily_return,
              COUNT(*) as trade_count
            FROM trades 
            WHERE type = ${typeParam}
              AND data = 'Trade'
              AND date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(date)
            ORDER BY DATE(date)
          ),
          benchmark_returns AS (
            SELECT 
              DATE("timestamp") as trade_date,
              AVG((ask + bid) / 2) as daily_value
            FROM "EURUSD_tickdata"
            WHERE "timestamp" >= CURRENT_DATE - INTERVAL '30 days'
              AND "timestamp" <= CURRENT_DATE
            GROUP BY DATE("timestamp")
            ORDER BY DATE("timestamp")
            LIMIT 40
          ),
          benchmark_with_returns AS (
            SELECT 
              trade_date,
              daily_value,
              (daily_value - LAG(daily_value) OVER (ORDER BY trade_date)) / LAG(daily_value) OVER (ORDER BY trade_date) as daily_return
            FROM benchmark_returns
          )
          SELECT 
            dr.trade_date,
            dr.daily_return,
            dr.trade_count,
            COALESCE(bwr.daily_return, 0) as benchmark_return
          FROM daily_returns dr
          LEFT JOIN benchmark_with_returns bwr ON dr.trade_date = bwr.trade_date
          ORDER BY dr.trade_date
        `
      } else if (days === 180) {
        dailyReturnsResult = await sql`
          WITH daily_returns AS (
            SELECT 
              DATE(date) as trade_date,
              SUM(result) as daily_return,
              COUNT(*) as trade_count
            FROM trades 
            WHERE type = ${typeParam}
              AND data = 'Trade'
              AND date >= CURRENT_DATE - INTERVAL '180 days'
            GROUP BY DATE(date)
            ORDER BY DATE(date)
          ),
          benchmark_returns AS (
            SELECT 
              DATE("timestamp") as trade_date,
              AVG((ask + bid) / 2) as daily_value
            FROM "EURUSD_tickdata"
            WHERE "timestamp" >= CURRENT_DATE - INTERVAL '180 days'
              AND "timestamp" <= CURRENT_DATE
            GROUP BY DATE("timestamp")
            ORDER BY DATE("timestamp")
            LIMIT 200
          ),
          benchmark_with_returns AS (
            SELECT 
              trade_date,
              daily_value,
              (daily_value - LAG(daily_value) OVER (ORDER BY trade_date)) / LAG(daily_value) OVER (ORDER BY trade_date) as daily_return
            FROM benchmark_returns
          )
          SELECT 
            dr.trade_date,
            dr.daily_return,
            dr.trade_count,
            COALESCE(bwr.daily_return, 0) as benchmark_return
          FROM daily_returns dr
          LEFT JOIN benchmark_with_returns bwr ON dr.trade_date = bwr.trade_date
          ORDER BY dr.trade_date
        `
      } else if (days === 365) {
        dailyReturnsResult = await sql`
          WITH daily_returns AS (
            SELECT 
              DATE(date) as trade_date,
              SUM(result) as daily_return,
              COUNT(*) as trade_count
            FROM trades 
            WHERE type = ${typeParam}
              AND data = 'Trade'
              AND date >= CURRENT_DATE - INTERVAL '365 days'
            GROUP BY DATE(date)
            ORDER BY DATE(date)
          ),
          benchmark_returns AS (
            SELECT 
              DATE("timestamp") as trade_date,
              AVG((ask + bid) / 2) as daily_value
            FROM "EURUSD_tickdata"
            WHERE "timestamp" >= CURRENT_DATE - INTERVAL '365 days'
              AND "timestamp" <= CURRENT_DATE
            GROUP BY DATE("timestamp")
            ORDER BY DATE("timestamp")
            LIMIT 400
          ),
          benchmark_with_returns AS (
            SELECT 
              trade_date,
              daily_value,
              (daily_value - LAG(daily_value) OVER (ORDER BY trade_date)) / LAG(daily_value) OVER (ORDER BY trade_date) as daily_return
            FROM benchmark_returns
          )
          SELECT 
            dr.trade_date,
            dr.daily_return,
            dr.trade_count,
            COALESCE(bwr.daily_return, 0) as benchmark_return
          FROM daily_returns dr
          LEFT JOIN benchmark_with_returns bwr ON dr.trade_date = bwr.trade_date
          ORDER BY dr.trade_date
        `
      } else if (days <= 0) {
        // For "all data", don't use date filter for trades but use 365 days for benchmark
        dailyReturnsResult = await sql`
          WITH daily_returns AS (
            SELECT 
              DATE(date) as trade_date,
              SUM(result) as daily_return,
              COUNT(*) as trade_count
            FROM trades 
            WHERE type = ${typeParam}
              AND data = 'Trade'
            GROUP BY DATE(date)
            ORDER BY DATE(date)
          ),
          benchmark_returns AS (
            SELECT 
              DATE("timestamp") as trade_date,
              AVG((ask + bid) / 2) as daily_value
            FROM "EURUSD_tickdata"
            WHERE "timestamp" >= CURRENT_DATE - INTERVAL '365 days'
              AND "timestamp" <= CURRENT_DATE
            GROUP BY DATE("timestamp")
            ORDER BY DATE("timestamp")
          ),
          benchmark_with_returns AS (
            SELECT 
              trade_date,
              daily_value,
              (daily_value - LAG(daily_value) OVER (ORDER BY trade_date)) / LAG(daily_value) OVER (ORDER BY trade_date) as daily_return
            FROM benchmark_returns
          )
          SELECT 
            dr.trade_date,
            dr.daily_return,
            dr.trade_count,
            COALESCE(bwr.daily_return, 0) as benchmark_return
          FROM daily_returns dr
          LEFT JOIN benchmark_with_returns bwr ON dr.trade_date = bwr.trade_date
          ORDER BY dr.trade_date
        `
      } else {
        // Default to 90 days for other values
        dailyReturnsResult = await sql`
          WITH daily_returns AS (
            SELECT 
              DATE(date) as trade_date,
              SUM(result) as daily_return,
              COUNT(*) as trade_count
            FROM trades 
            WHERE type = ${typeParam}
              AND data = 'Trade'
              AND date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY DATE(date)
            ORDER BY DATE(date)
          ),
          benchmark_returns AS (
            SELECT 
              DATE("timestamp") as trade_date,
              AVG((ask + bid) / 2) as daily_value
            FROM "EURUSD_tickdata"
            WHERE "timestamp" >= CURRENT_DATE - INTERVAL '90 days'
              AND "timestamp" <= CURRENT_DATE
            GROUP BY DATE("timestamp")
            ORDER BY DATE("timestamp")
            LIMIT 100
          ),
          benchmark_with_returns AS (
            SELECT 
              trade_date,
              daily_value,
              (daily_value - LAG(daily_value) OVER (ORDER BY trade_date)) / LAG(daily_value) OVER (ORDER BY trade_date) as daily_return
            FROM benchmark_returns
          )
          SELECT 
            dr.trade_date,
            dr.daily_return,
            dr.trade_count,
            COALESCE(bwr.daily_return, 0) as benchmark_return
          FROM daily_returns dr
          LEFT JOIN benchmark_with_returns bwr ON dr.trade_date = bwr.trade_date
          ORDER BY dr.trade_date
        `
      }
    }
    // ALL types cases
    else {
      if (days === 30) {
        dailyReturnsResult = await sql`
          WITH daily_returns AS (
            SELECT 
              DATE(date) as trade_date,
              SUM(result) as daily_return,
              COUNT(*) as trade_count
            FROM trades 
            WHERE data = 'Trade'
              AND date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(date)
            ORDER BY DATE(date)
          ),
          benchmark_returns AS (
            SELECT 
              DATE("timestamp") as trade_date,
              AVG((ask + bid) / 2) as daily_value
            FROM "EURUSD_tickdata"
            WHERE "timestamp" >= CURRENT_DATE - INTERVAL '30 days'
              AND "timestamp" <= CURRENT_DATE
            GROUP BY DATE("timestamp")
            ORDER BY DATE("timestamp")
            LIMIT 40
          ),
          benchmark_with_returns AS (
            SELECT 
              trade_date,
              daily_value,
              (daily_value - LAG(daily_value) OVER (ORDER BY trade_date)) / LAG(daily_value) OVER (ORDER BY trade_date) as daily_return
            FROM benchmark_returns
          )
          SELECT 
            dr.trade_date,
            dr.daily_return,
            dr.trade_count,
            COALESCE(bwr.daily_return, 0) as benchmark_return
          FROM daily_returns dr
          LEFT JOIN benchmark_with_returns bwr ON dr.trade_date = bwr.trade_date
          ORDER BY dr.trade_date
        `
      } else if (days === 180) {
        dailyReturnsResult = await sql`
          WITH daily_returns AS (
            SELECT 
              DATE(date) as trade_date,
              SUM(result) as daily_return,
              COUNT(*) as trade_count
            FROM trades 
            WHERE data = 'Trade'
              AND date >= CURRENT_DATE - INTERVAL '180 days'
            GROUP BY DATE(date)
            ORDER BY DATE(date)
          ),
          benchmark_returns AS (
            SELECT 
              DATE("timestamp") as trade_date,
              AVG((ask + bid) / 2) as daily_value
            FROM "EURUSD_tickdata"
            WHERE "timestamp" >= CURRENT_DATE - INTERVAL '180 days'
              AND "timestamp" <= CURRENT_DATE
            GROUP BY DATE("timestamp")
            ORDER BY DATE("timestamp")
            LIMIT 200
          ),
          benchmark_with_returns AS (
            SELECT 
              trade_date,
              daily_value,
              (daily_value - LAG(daily_value) OVER (ORDER BY trade_date)) / LAG(daily_value) OVER (ORDER BY trade_date) as daily_return
            FROM benchmark_returns
          )
          SELECT 
            dr.trade_date,
            dr.daily_return,
            dr.trade_count,
            COALESCE(bwr.daily_return, 0) as benchmark_return
          FROM daily_returns dr
          LEFT JOIN benchmark_with_returns bwr ON dr.trade_date = bwr.trade_date
          ORDER BY dr.trade_date
        `
      } else if (days === 365) {
        dailyReturnsResult = await sql`
          WITH daily_returns AS (
            SELECT 
              DATE(date) as trade_date,
              SUM(result) as daily_return,
              COUNT(*) as trade_count
            FROM trades 
            WHERE data = 'Trade'
              AND date >= CURRENT_DATE - INTERVAL '365 days'
            GROUP BY DATE(date)
            ORDER BY DATE(date)
          ),
          benchmark_returns AS (
            SELECT 
              DATE("timestamp") as trade_date,
              AVG((ask + bid) / 2) as daily_value
            FROM "EURUSD_tickdata"
            WHERE "timestamp" >= CURRENT_DATE - INTERVAL '365 days'
              AND "timestamp" <= CURRENT_DATE
            GROUP BY DATE("timestamp")
            ORDER BY DATE("timestamp")
            LIMIT 400
          ),
          benchmark_with_returns AS (
            SELECT 
              trade_date,
              daily_value,
              (daily_value - LAG(daily_value) OVER (ORDER BY trade_date)) / LAG(daily_value) OVER (ORDER BY trade_date) as daily_return
            FROM benchmark_returns
          )
          SELECT 
            dr.trade_date,
            dr.daily_return,
            dr.trade_count,
            COALESCE(bwr.daily_return, 0) as benchmark_return
          FROM daily_returns dr
          LEFT JOIN benchmark_with_returns bwr ON dr.trade_date = bwr.trade_date
          ORDER BY dr.trade_date
        `
      } else if (days <= 0) {
        // For "all data", don't use date filter for trades but use 365 days for benchmark
        dailyReturnsResult = await sql`
          WITH daily_returns AS (
            SELECT 
              DATE(date) as trade_date,
              SUM(result) as daily_return,
              COUNT(*) as trade_count
            FROM trades 
            WHERE data = 'Trade'
            GROUP BY DATE(date)
            ORDER BY DATE(date)
          ),
          benchmark_returns AS (
            SELECT 
              DATE("timestamp") as trade_date,
              AVG((ask + bid) / 2) as daily_value
            FROM "EURUSD_tickdata"
            WHERE "timestamp" >= CURRENT_DATE - INTERVAL '365 days'
              AND "timestamp" <= CURRENT_DATE
            GROUP BY DATE("timestamp")
            ORDER BY DATE("timestamp")
          ),
          benchmark_with_returns AS (
            SELECT 
              trade_date,
              daily_value,
              (daily_value - LAG(daily_value) OVER (ORDER BY trade_date)) / LAG(daily_value) OVER (ORDER BY trade_date) as daily_return
            FROM benchmark_returns
          )
          SELECT 
            dr.trade_date,
            dr.daily_return,
            dr.trade_count,
            COALESCE(bwr.daily_return, 0) as benchmark_return
          FROM daily_returns dr
          LEFT JOIN benchmark_with_returns bwr ON dr.trade_date = bwr.trade_date
          ORDER BY dr.trade_date
        `
      } else {
        // Default to 90 days for other values
        dailyReturnsResult = await sql`
          WITH daily_returns AS (
            SELECT 
              DATE(date) as trade_date,
              SUM(result) as daily_return,
              COUNT(*) as trade_count
            FROM trades 
            WHERE data = 'Trade'
              AND date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY DATE(date)
            ORDER BY DATE(date)
          ),
          benchmark_returns AS (
            SELECT 
              DATE("timestamp") as trade_date,
              AVG((ask + bid) / 2) as daily_value
            FROM "EURUSD_tickdata"
            WHERE "timestamp" >= CURRENT_DATE - INTERVAL '90 days'
              AND "timestamp" <= CURRENT_DATE
            GROUP BY DATE("timestamp")
            ORDER BY DATE("timestamp")
            LIMIT 100
          ),
          benchmark_with_returns AS (
            SELECT 
              trade_date,
              daily_value,
              (daily_value - LAG(daily_value) OVER (ORDER BY trade_date)) / LAG(daily_value) OVER (ORDER BY trade_date) as daily_return
            FROM benchmark_returns
          )
          SELECT 
            dr.trade_date,
            dr.daily_return,
            dr.trade_count,
            COALESCE(bwr.daily_return, 0) as benchmark_return
          FROM daily_returns dr
          LEFT JOIN benchmark_with_returns bwr ON dr.trade_date = bwr.trade_date
          ORDER BY dr.trade_date
        `
      }
    }

    // Calculate cumulative returns
    let cumulativeReturn = 1
    let benchmarkCumulativeReturn = 1
    
    const returnsData = dailyReturnsResult.rows.map((day: any) => {
      // Convert to decimal form for compound calculation (e.g., 5% = 0.05)
      const dailyReturn = Number(day.daily_return || 0)
      const benchmarkReturn = Number(day.benchmark_return || 0)
      
      // Compound returns (multiply by (1 + return))
      cumulativeReturn = cumulativeReturn * (1 + dailyReturn)
      benchmarkCumulativeReturn = benchmarkCumulativeReturn * (1 + benchmarkReturn)
      
      // Convert to percentage for display
      const cumulativeReturnPct = (cumulativeReturn - 1) * 100
      const benchmarkCumulativeReturnPct = (benchmarkCumulativeReturn - 1) * 100
      
      return {
        trade_date: day.trade_date,
        daily_return: dailyReturn * 100, // Convert to percentage for display
        trade_count: Number(day.trade_count || 0),
        cumulative_return: cumulativeReturnPct,
        benchmark_return: benchmarkReturn * 100, // Convert to percentage for display
        benchmark_cumulative_return: benchmarkCumulativeReturnPct
      }
    })

    return NextResponse.json({
      success: true,
      data: returnsData
    })
  } catch (error) {
    console.error("Error fetching equity curve data:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
} 