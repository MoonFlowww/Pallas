import { NextResponse } from "next/server"
import { saveTrade, getTradesByType, tradeSchema } from "@/lib/db"
import * as z from "zod"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Calculate return percentage based on entry, exit, bias, and risk
    let returnPercent = null
    if (body.state === "out" && body.entryPrice && body.finality) {
      const entryPrice = Number(body.entryPrice)
      let exitPrice = null
      
      // Determine exit price based on finality
      if (body.finality === "tp" && body.tpPrice) {
        exitPrice = Number(body.tpPrice)
      } else if (body.finality === "sl" && body.slPrice) {
        exitPrice = Number(body.slPrice)
      } else if (body.finality === "partial") {
        if (body.breakEven && body.entryPrice) {
          // If BE is true, use entry price
          exitPrice = entryPrice
        } else if (body.partialPrice) {
          // Otherwise use partial price
          exitPrice = Number(body.partialPrice)
        }
      }
      
      if (exitPrice !== null) {
        const isLong = body.bias === true
        const risk = Number(body.riskPercentage) || 1
        
        if (isLong) {
          // For long positions: (exit - entry) / entry * 100 / risk
          returnPercent = ((exitPrice - entryPrice) / entryPrice) * 100 / risk
        } else {
          // For short positions: (entry - exit) / entry * 100 / risk
          returnPercent = ((entryPrice - exitPrice) / entryPrice) * 100 / risk
        }
      }
    }

    // Parse and validate the request body
    const validatedData = tradeSchema.parse({
      data: "Trade", // Set data field to "Trade"
      type: body.positionType?.toUpperCase() === "DEMO" ? "PAPER" : "REAL",
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      asset: body.asset,
      biais: body.bias === true ? "LONG" : "SHORT", // Convert boolean to string
      entry_price: Number(body.entryPrice),
      exit_price: getExitPrice(body),
      tp: body.tpPrice ? Number(body.tpPrice) : null,
      sl: body.slPrice ? Number(body.slPrice) : null,
      be: body.breakEven ?? false,
      risk: Number(body.riskPercentage),
      state: body.state === "in" ? "LIVE" : "CLOSED",
      return_percent: returnPercent,
      acc: body.accountNumber || null,
      screenshot: body.screenshot || null,
      // Set default values for required fields
      exit_time: null,
      rr: null,
      r: null,
      hedge: null,
      aum: null,
      aum_deposit: null,
      aum_withdraw: null,
      mdd: null,
      calmar: null,
      ui: null,
      upi: null,
      theta_overperfom: null,
      finallinereturn_overperfom: null,
      exit_timing: null,
      exit_exhaust: null,
      trade_completion: null,
      trend_peak: null,
      trend_valley: null,
      trend_during_exit: null,
      linearregression_thetascore: null,
      entryexilLine_returnscore: null,
      rebounceafterexit: null,
      maxreturn: null,
      EntryShift: null,
      ExitShift: null,
      datapicture: null,
      correction_screenshot: null,
      comment: null,
      style_regime: null,
      style_timeframe: null,
      style_depth: null,
      style_entree: null,
      style_tp: null,
      style_sl: null,
      style_management: null,
      style_analysis_pillar: null,
      personal_mood: null,
      personal_market_complexity: null,
      personal_estimation: null
    })

    const result = await saveTrade(validatedData)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("API error:", error)

    // Handle Zod validation errors specifically
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    // Handle other types of errors
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save trade",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

// Helper function to determine exit price based on form data
function getExitPrice(body: any): number | null {
  if (body.state !== "out") {
    return null
  }
  
  if (body.finality === "tp" && body.tpPrice) {
    return Number(body.tpPrice)
  }
  
  if (body.finality === "sl" && body.slPrice) {
    return Number(body.slPrice)
  }
  
  if (body.finality === "partial") {
    if (body.breakEven && body.entryPrice) {
      // If BE is true, use entry price
      return Number(body.entryPrice)
    } else if (body.partialPrice) {
      return Number(body.partialPrice)
    }
  }
  
  return null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")?.toLowerCase() // Convert to lowercase

    console.log("API: Fetching trades with type:", type)

    if (!type) {
      console.error("API: Missing type parameter")
      return NextResponse.json(
        {
          success: false,
          error: "Trade type is required",
        },
        { status: 400 },
      )
    }

    // Add more detailed logging
    console.log("API: Calling getTradesByType with type:", type)
    const result = await getTradesByType(type)
    console.log(`API: Successfully fetched ${result.trades.length} trades`)
    if (result.trades.length > 0) {
      console.log("API: First trade sample:", result.trades[0])
    }
    
    return NextResponse.json({ 
      success: true, 
      positions: result.trades,
      count: result.trades.length,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCount: result.totalCount
      }
    })
  } catch (error: unknown) {
    // Enhanced error logging
    console.error("API: Failed to fetch trades:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : "Unknown"
    })

    // Return a more detailed error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch trades",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        errorType: error instanceof Error ? error.constructor.name : "Unknown"
      },
      { status: 500 },
    )
  }
}

