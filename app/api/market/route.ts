import { NextResponse } from "next/server"
import { getEURUSDTickData } from "@/lib/db"

export async function GET() {
  try {
    console.log("API: Fetching EURUSD tick data")
    const ticks = await getEURUSDTickData(100)
    
    return NextResponse.json({
      success: true,
      data: ticks
    })
  } catch (error) {
    console.error("API: Error fetching EURUSD tick data:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch market data" },
      { status: 500 }
    )
  }
} 