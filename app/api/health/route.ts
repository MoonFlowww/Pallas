import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection
    await pool.query('SELECT 1')
    
    return NextResponse.json({
      status: "healthy",
      database: "connected"
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json({
      status: "unhealthy",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 