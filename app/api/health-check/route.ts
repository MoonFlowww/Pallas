import { Pool } from "pg"
import { NextResponse } from "next/server"

const connectionString = process.env.TRADES_DB_URL || process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error('TRADES_DB_URL is not configured')
}
const pool = new Pool({
  connectionString,
})

export async function GET() {
  try {
    const client = await pool.connect()
    try {
      const result = await client.query("SELECT current_database(), current_user, version()")
      const dbInfo = result.rows[0]

      console.log("Database connection test successful:", {
        database: dbInfo.current_database,
        user: dbInfo.current_user,
        version: dbInfo.version,
      })

      return NextResponse.json({
        success: true,
        message: "Successfully connected to PallasDB",
        config: {
          database: dbInfo.current_database,
          user: dbInfo.current_user,
        },
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Database health check failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to connect to database",
        details: {
          message: "Please ensure your PostgreSQL connection string is correctly configured",
        },
      },
      { status: 500 },
    )
  }
}

