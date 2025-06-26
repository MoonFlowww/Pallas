import { NextResponse } from "next/server"
import { getMarketTables } from "@/lib/db"

export async function GET() {
  try {
    const tables = await getMarketTables()
    return NextResponse.json({ success: true, tables })
  } catch (error) {
    console.error("API: failed to fetch market tables", error)
    return NextResponse.json({ success: false, tables: [] })
  }
}
