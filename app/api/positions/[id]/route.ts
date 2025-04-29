import { NextResponse } from "next/server"
import { updateTradeWithBalance } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    const result = await updateTradeWithBalance(id, body.exitType, body.exitPrice, body.breakEven)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to update position:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update position",
      },
      { status: 500 },
    )
  }
}

