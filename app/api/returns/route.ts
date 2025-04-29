import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "REAL"
    const days = parseInt(searchParams.get("days") || "60")

    let tradesResult;
    
    if (days === 30) {
      tradesResult = await sql`
        SELECT 
          id,
          date,
          type,
          side,
          profit,
          loss,
          risk_reward_ratio,
          result,
          take_profit,
          stop_loss,
          entry,
          data
        FROM trades 
        WHERE type = ${type}
          AND data = 'Trade'
          AND date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY date DESC
      `
    } else if (days === 60) {
      tradesResult = await sql`
        SELECT 
          id,
          date,
          type,
          side,
          profit,
          loss,
          risk_reward_ratio,
          result,
          take_profit,
          stop_loss,
          entry,
          data
        FROM trades 
        WHERE type = ${type}
          AND data = 'Trade'
          AND date >= CURRENT_DATE - INTERVAL '60 days'
        ORDER BY date DESC
      `
    } else if (days === 90) {
      tradesResult = await sql`
        SELECT 
          id,
          date,
          type,
          side,
          profit,
          loss,
          risk_reward_ratio,
          result,
          take_profit,
          stop_loss,
          entry,
          data
        FROM trades 
        WHERE type = ${type}
          AND data = 'Trade'
          AND date >= CURRENT_DATE - INTERVAL '90 days'
        ORDER BY date DESC
      `
    } else if (days === 180) {
      tradesResult = await sql`
        SELECT 
          id,
          date,
          type,
          side,
          profit,
          loss,
          risk_reward_ratio,
          result,
          take_profit,
          stop_loss,
          entry,
          data
        FROM trades 
        WHERE type = ${type}
          AND data = 'Trade'
          AND date >= CURRENT_DATE - INTERVAL '180 days'
        ORDER BY date DESC
      `
    } else if (days === 365) {
      tradesResult = await sql`
        SELECT 
          id,
          date,
          type,
          side,
          profit,
          loss,
          risk_reward_ratio,
          result,
          take_profit,
          stop_loss,
          entry,
          data
        FROM trades 
        WHERE type = ${type}
          AND data = 'Trade'
          AND date >= CURRENT_DATE - INTERVAL '365 days'
        ORDER BY date DESC
      `
    } else if (days <= 0) {
      tradesResult = await sql`
        SELECT 
          id,
          date,
          type,
          side,
          profit,
          loss,
          risk_reward_ratio,
          result,
          take_profit,
          stop_loss,
          entry,
          data
        FROM trades 
        WHERE type = ${type}
          AND data = 'Trade'
        ORDER BY date DESC
      `
    } else {
      tradesResult = await sql`
        SELECT 
          id,
          date,
          type,
          side,
          profit,
          loss,
          risk_reward_ratio,
          result,
          take_profit,
          stop_loss,
          entry,
          data
        FROM trades 
        WHERE type = ${type}
          AND data = 'Trade'
          AND date >= CURRENT_DATE - INTERVAL '90 days'
        ORDER BY date DESC
      `
    }

    // Calculate running cumulative returns
    let cumulativeReturn = 0
    const processedTrades = tradesResult.rows.map(trade => {
      cumulativeReturn += Number(trade.result || 0)
      return {
        ...trade,
        cumulative_return: cumulativeReturn
      }
    }).reverse() 

    const winningTrades = processedTrades.filter(trade => Number(trade.profit) > 0)
    const losingTrades = processedTrades.filter(trade => Number(trade.loss) > 0)
    
    const metrics = {
      totalTrades: processedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: processedTrades.length > 0 ? (winningTrades.length / processedTrades.length) * 100 : 0,
      averageReturn: processedTrades.length > 0 ? 
        processedTrades.reduce((sum, trade) => sum + Number(trade.result || 0), 0) / processedTrades.length : 0,
      averageWin: winningTrades.length > 0 ?
        winningTrades.reduce((sum, trade) => sum + Number(trade.result || 0), 0) / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ?
        losingTrades.reduce((sum, trade) => sum + Number(trade.result || 0), 0) / losingTrades.length : 0,
      profitFactor: losingTrades.length > 0 && losingTrades.reduce((sum, trade) => sum + Math.abs(Number(trade.loss || 0)), 0) > 0 ?
        winningTrades.reduce((sum, trade) => sum + Number(trade.profit || 0), 0) / 
        losingTrades.reduce((sum, trade) => sum + Math.abs(Number(trade.loss || 0)), 0) : 0,
      averageRiskRewardRatio: processedTrades.filter(t => t.risk_reward_ratio).length > 0 ?
        processedTrades.reduce((sum, trade) => sum + Number(trade.risk_reward_ratio || 0), 0) / 
        processedTrades.filter(t => t.risk_reward_ratio).length : 0,
      maxDrawdown: processedTrades.length > 0 ? 
        Math.min(...processedTrades.map(t => Number(t.cumulative_return))) : 0
    }

    return NextResponse.json({
      success: true,
      trades: processedTrades.reverse(), // Reverse back to desc order for display
      metrics
    })
  } catch (error) {
    console.error("Error fetching trade metrics:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

