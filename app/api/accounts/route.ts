import { NextResponse } from "next/server"
import {
  addAccountTransaction,
  getAccountBalance,
  getCompleteBalanceHistory,
  accountTransactionSchema,
  initializeAccountsTable,
  initializeBalanceHistoryTable,
} from "@/lib/db"

export async function GET() {
  try {
    await Promise.all([initializeAccountsTable(), initializeBalanceHistoryTable()])

    const [balanceResult, historyResult] = await Promise.all([getAccountBalance(), getCompleteBalanceHistory()])

    return NextResponse.json({
      success: true,
      balance: balanceResult.balance,
      transactions: historyResult.history,
    })
  } catch (error) {
    console.error("Failed to get account data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get account data",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = accountTransactionSchema.parse(body)
    const result = await addAccountTransaction(validatedData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to add transaction:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add transaction",
      },
      { status: 500 },
    )
  }
}

