"use client"

import { useState, useCallback, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { TradingSessions } from "@/components/trading-sessions"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { InputForm } from "@/components/trading/input-form"
import { StatsCard } from "@/components/trading/stats-card"
import { PriceChart } from "@/components/trading/price-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ErrorBoundary } from "@/components/error-boundary"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useForm } from "react-hook-form"

const REFERENCE_TIME = new Date("2025-02-09T17:59:00").toLocaleString("en-US", {
  timeZone: "Europe/Paris",
})

type Position = {
  id: number
  type: "REAL" | "PAPER"
  data: string
  date: string
  asset: string
  entry_price: number
  exit_price?: number
  tp?: number
  sl?: number
  is_long: boolean
  exit_type?: "tp" | "sl" | "partial"
  be: boolean
  screenshot?: string
  current_price?: number
  risk_percentage?: number
}

// Chart position type from components/trading/price-chart.tsx
type ChartPosition = {
  entry: number
  takeProfit?: number
  stopLoss?: number
  exitPrice?: number
  isLong: boolean
}

interface StatsState {
  return: {
    value: string
    progress: number
    animate: boolean
    entry?: number
    tp?: number
    sl?: number
    partialExit?: number
    isLong: boolean
    breakEven: boolean
    exitType?: "tp" | "sl" | "partial" | null
    currentPrice?: number
    riskPercentage?: number
  }
  riskReward: {
    ratio: string
    segments: Array<{ type: string; filled: boolean }>
  }
  maxDrawdown: {
    value: string
    progress: number
  }
  metrics: Array<{
    name: string
    value: string
    color: string
  }>
}

export default function TradingInputsPage() {
  const form = useForm<{
    finality?: "tp" | "sl" | "partial" | null
  }>()
  const [selectedAsset, setSelectedAsset] = useState("")
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null)
  const [openPositions, setOpenPositions] = useState<Position[]>([])
  const [loadingPositions, setLoadingPositions] = useState(true)
  const [editingPosition, setEditingPosition] = useState<number | null>(null)
  const [stats, setStats] = useState<StatsState>({
    return: {
      value: "+0.00%",
      progress: 0,
      animate: true,
      isLong: true,
      breakEven: false,
    },
    riskReward: {
      ratio: "0:0",
      segments: Array(5).fill({ type: "empty", filled: false }),
    },
    maxDrawdown: { value: "0.00%", progress: 0 },
    metrics: [
      { name: "Sharpe", value: "0.00", color: "orange" },
      { name: "Sortino", value: "0.00", color: "yellow" },
      { name: "UPI", value: "0.00", color: "blue" },
      { name: "Calmar", value: "0.00", color: "purple" },
    ],
  })
  const [exitedPositions, setExitedPositions] = useState<Set<number>>(new Set())
  const [exitErrors, setExitErrors] = useState<{ [key: string]: string }>({})
  const [currentMetrics, setCurrentMetrics] = useState({
    returnPercentage: null as number | null,
    riskRewardRatio: null as number | null,
  })
  const [entryTime, setEntryTime] = useState<string | null>(null)
  const [exitTime, setExitTime] = useState<string | null>(null)
  const [exitType, setExitType] = useState<"tp" | "sl" | "partial" | null>(null)
  const [selectedTradeForChart, setSelectedTradeForChart] = useState<Position | null>(null)

  useEffect(() => {
    async function fetchOpenPositions() {
      try {
        setLoadingPositions(true)
        const response = await fetch("/api/positions?type=real")
        const data = await response.json()

        if (data.success && Array.isArray(data.positions)) {
          // Transform API data to match our Position interface
          // Filter trades where live=true instead of checking state
          const transformedPositions = data.positions
            .filter((pos: any) => pos.live === true)
            .map((pos: any) => ({
              id: Number(pos.id),
              type: pos.type.toUpperCase() as "REAL" | "PAPER",
              data: pos.data || "Trade",
              date: pos.date,
              asset: pos.asset,
              entry_price: Number(pos.entry_price) || 0,
              exit_price: pos.exit_price ? Number(pos.exit_price) : undefined,
              tp: pos.tp ? Number(pos.tp) : undefined,
              sl: pos.sl ? Number(pos.sl) : undefined,
              is_long: pos.biais === "LONG", // Convert string biais to boolean is_long
              exit_type: pos.exit_type as "tp" | "sl" | "partial" | undefined,
              be: Boolean(pos.be),
              screenshot: pos.screenshot,
              current_price: Number(pos.current_price || pos.entry_price || 0),
              risk_percentage: pos.risk ? Number(pos.risk) : undefined
            }))
          setOpenPositions(transformedPositions)
        }
      } catch (error) {
        console.error("Failed to fetch open positions:", error)
      } finally {
        setLoadingPositions(false)
      }
    }

    fetchOpenPositions()
  }, []) // Empty dependency array - fetch only on mount

  const handlePositionUpdate = useCallback((pos: any) => {
    if (!pos) {
      setCurrentPosition(null)
      return
    }

    setCurrentPosition({
      id: pos.id,
      type: pos.type.toUpperCase(),
      data: pos.data || "Trade",
      date: pos.date || new Date().toISOString(),
      asset: pos.asset || "",
      entry_price: Number(pos.entry_price) || 0,
      exit_price: pos.exit_price ? Number(pos.exit_price) : undefined,
      tp: pos.tp ? Number(pos.tp) : undefined,
      sl: pos.sl ? Number(pos.sl) : undefined,
      is_long: Boolean(pos.is_long),
      exit_type: pos.exit_type,
      be: Boolean(pos.be),
      screenshot: pos.screenshot,
      current_price: Number(pos.current_price || pos.entry_price || 0),
      risk_percentage: pos.risk_percentage ? Number(pos.risk_percentage) : undefined
    })
  }, [])

  const handlePositionChange = useCallback((values: Partial<Position>) => {
    setCurrentPosition((prev) => {
      if (!prev) return null
      return { ...prev, ...values }
    })
  }, [])

  const handleAssetChange = useCallback((asset: string) => {
    setSelectedAsset(asset)
  }, [])

  const handleEntryTimeChange = useCallback((time: string) => {
    setEntryTime(time)
    // Time is stored but we don't need to display it in a separate card anymore
  }, [])

  const handleExitTimeChange = useCallback((time: string) => {
    setExitTime(time)
  }, [])

  const handleExitTypeChange = useCallback((type: "tp" | "sl" | "partial") => {
    setExitType(type)
    
    // Set form finality if available
    if (form) {
      form.setValue("finality", type)
    }
  }, [form])

  const handleEntryPriceChange = useCallback((price: number) => {
    // Update the currentPosition if it exists
    if (currentPosition) {
      handlePositionChange({
        ...currentPosition,
        entry_price: price
      })
    }
  }, [currentPosition, handlePositionChange])

  const viewTradeOnChart = useCallback((trade: Position) => {
    // Set the selected trade for the chart to display
    setSelectedTradeForChart(trade)
    
    // Set chart entry point if trade has entry price and time
    if (trade.entry_price && trade.date) {
      setEntryTime(trade.date)
      handleEntryPriceChange(trade.entry_price)
    }
    
    // Set chart exit point if trade has exit price and exit type
    if (trade.exit_price && trade.exit_type) {
      setExitTime(trade.date) // Same date as entry for simplicity
      setExitType(trade.exit_type)
    }
    
    // Set the asset in the chart
    setSelectedAsset(trade.asset)
  }, [handleEntryPriceChange, setSelectedAsset])

  const handleClosePosition = (positionId: number, exit_type: Position["exit_type"]) => {
    setOpenPositions((positions) =>
      positions.map((pos) =>
        pos.id === positionId
          ? {
              ...pos,
              exit_type,
            }
          : pos,
      ),
    )
  }

  const handleUpdatePosition = (positionId: number, updates: Partial<Position>) => {
    setOpenPositions((positions) => positions.map((pos) => (pos.id === positionId ? { ...pos, ...updates } : pos)))
    setEditingPosition(null)
  }

  const calculateCurrentMetrics = useCallback(
    (position: Position | null) => {
      if (!position) {
        setCurrentMetrics({ returnPercentage: null, riskRewardRatio: null })
        return
      }

      const metrics = {
        returnPercentage: null as number | null,
        riskRewardRatio: null as number | null,
      }

      // Calculate return based on exit type
      if (position.entry_price) {
        let targetPrice = position.current_price || position.entry_price

        // Override target price based on exit type selection
        if (form?.watch("finality") === "tp" && position.tp) {
          targetPrice = position.tp
        } else if (form?.watch("finality") === "sl" && position.sl) {
          targetPrice = position.sl
        } else if (form?.watch("finality") === "partial" && position.exit_price) {
          targetPrice = position.exit_price
        }

        const priceChange = targetPrice - position.entry_price
        metrics.returnPercentage = position.is_long
          ? (priceChange / position.entry_price) * 100
          : (-priceChange / position.entry_price) * 100

        // Calculate account return considering risk percentage
        const accountReturn = (metrics.returnPercentage * (position.risk_percentage || 1)) / 100
        setStats((prev) => ({
          ...prev,
          return: {
            ...prev.return,
            entry: position.entry_price,
            tp: position.tp,
            sl: position.sl,
            partialExit: position.exit_price,
            isLong: position.is_long,
            breakEven: position.be,
            exitType: form?.watch("finality") as "tp" | "sl" | "partial" | null,
            currentPrice: targetPrice,
            riskPercentage: position.risk_percentage || 1,
            value: `${accountReturn >= 0 ? "+" : ""}${accountReturn.toFixed(2)}%`,
            progress: Math.min(Math.abs(accountReturn * 2), 100),
            animate: true,
          },
        }))
      }

      // Calculate risk:reward ratio if we have both TP and SL
      if (position.tp && position.sl) {
        const reward = Math.abs(position.tp - position.entry_price)
        const risk = Math.abs(position.sl - position.entry_price)
        metrics.riskRewardRatio = reward / risk
      }

      setCurrentMetrics(metrics)

      // Update stats card
      setStats((prev) => ({
        ...prev,
        riskReward: {
          ratio: metrics.riskRewardRatio ? `1:${metrics.riskRewardRatio.toFixed(2)}` : "0:0",
          segments: prev.riskReward.segments,
        },
      }))
    },
    [form],
  )

  // Update metrics when position changes
  useEffect(() => {
    calculateCurrentMetrics(currentPosition)
  }, [currentPosition, calculateCurrentMetrics])

  // Map database position to chart position
  const mapToChartPosition = (pos: Position | null): ChartPosition | null => {
    if (!pos) return null
    return {
      entry: pos.entry_price,
      takeProfit: pos.tp,
      stopLoss: pos.sl,
      exitPrice: pos.exit_price,
      isLong: pos.is_long,
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
          <SidebarTrigger className="-ml-2" />
          <div className="pr-4">
            <TradingSessions />
          </div>
        </header>
        <ErrorBoundary>
          <div className="flex flex-col gap-6 p-6">
            <div className="grid gap-6 md:grid-cols-[3fr,1fr]">
              <div className="space-y-6">
                <InputForm 
                  onAssetChange={handleAssetChange} 
                  onPositionUpdate={handlePositionUpdate}
                />
              </div>
              <StatsCard stats={stats} />
            </div>
            <PriceChart 
              asset={selectedAsset} 
              position={mapToChartPosition(selectedTradeForChart || currentPosition)} 
              onEntryTimeChange={handleEntryTimeChange}
              onExitTimeChange={handleExitTimeChange}
              onExitTypeChange={handleExitTypeChange}
              onEntryPriceChange={handleEntryPriceChange}
            />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Open Positions</CardTitle>
                <Button
                  onClick={async () => {
                    const newErrors: { [key: string]: string } = {}
                    let hasErrors = false

                    // Validate each exited position
                    exitedPositions.forEach((positionId) => {
                      const position = openPositions.find((p) => p.id === positionId)
                      if (position && !position.exit_type) {
                        newErrors[positionId.toString()] = "Please select an exit type (TP/Partial/SL)"
                        hasErrors = true
                      }
                    })

                    if (hasErrors) {
                      setExitErrors(newErrors)
                      return
                    }

                    // Update positions in database
                    try {
                      const promises = Array.from(exitedPositions).map(async (positionId) => {
                        const position = openPositions.find((p) => p.id === positionId)
                        if (!position) return

                        const response = await fetch(`/api/positions/${positionId}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            exitType: position.exit_type,
                            exitPrice: position.exit_price,
                            breakEven: position.be,
                          }),
                        })

                        if (!response.ok) {
                          throw new Error(`Failed to update position ${positionId}`)
                        }
                      })

                      await Promise.all(promises)

                      // If all updates successful, remove positions from UI
                      setOpenPositions((positions) => positions.filter((pos) => !exitedPositions.has(pos.id)))
                      setExitedPositions(new Set())
                      setExitErrors({})

                      toast.success("Positions updated successfully")
                    } catch (error) {
                      console.error("Failed to update positions:", error)
                      toast.error("Failed to update positions", {
                        description: error instanceof Error ? error.message : "An unexpected error occurred",
                      })
                    }
                  }}
                  variant="outline"
                >
                  Apply Changes
                </Button>
              </CardHeader>
              <CardContent>
                {loadingPositions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Action</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Entry</TableHead>
                        <TableHead>Current</TableHead>
                        <TableHead>TP</TableHead>
                        <TableHead>SL</TableHead>
                        <TableHead>Return</TableHead>
                        <TableHead className="w-[50px]">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openPositions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            No open positions found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        openPositions.map((position) => {
                          const returnPct = position.current_price !== undefined && position.entry_price
                            ? ((position.current_price - position.entry_price) / position.entry_price) * 100 * (position.is_long ? 1 : -1)
                            : 0

                          return (
                            <TableRow
                              key={position.id}
                              className={cn(exitedPositions.has(position.id) && "opacity-50")}
                            >
                              <TableCell>
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={cn(
                                        exitedPositions.has(position.id)
                                          ? "bg-red-500 text-white hover:bg-red-600"
                                          : "hover:bg-red-500/10",
                                      )}
                                      onClick={() => {
                                        setExitedPositions((prev) => {
                                          const next = new Set(prev)
                                          if (next.has(position.id)) {
                                            next.delete(position.id)
                                          } else {
                                            next.add(position.id)
                                          }
                                          return next
                                        })
                                      }}
                                    >
                                      {exitedPositions.has(position.id) ? "Exited" : "Exit"}
                                    </Button>
                                    <Switch
                                      checked={position.be}
                                      onClick={() => {
                                        handleUpdatePosition(position.id, {
                                          be: !position.be,
                                        })
                                      }}
                                    />
                                    <span className="text-xs text-muted-foreground">BE</span>
                                  </div>
                                  {exitedPositions.has(position.id) && (
                                    <>
                                      <Input
                                        type="number"
                                        placeholder="Partial Price"
                                        className="h-8 text-xs"
                                        value={position.exit_price || ""}
                                        onChange={(e) => {
                                          handleUpdatePosition(position.id, {
                                            exit_price: Number(e.target.value) || undefined,
                                          })
                                        }}
                                      />
                                      <div className="flex gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className={cn(
                                            "flex-1 text-xs",
                                            position.exit_type === "tp" && "bg-green-500 text-white hover:bg-green-600",
                                          )}
                                          onClick={() => handleUpdatePosition(position.id, { exit_type: "tp" })}
                                        >
                                          TP
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className={cn(
                                            "flex-1 text-xs",
                                            position.exit_type === "partial" &&
                                              "bg-yellow-500 text-white hover:bg-yellow-600",
                                          )}
                                          onClick={() => handleUpdatePosition(position.id, { exit_type: "partial" })}
                                        >
                                          Partial
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className={cn(
                                            "flex-1 text-xs",
                                            position.exit_type === "sl" && "bg-red-500 text-white hover:bg-red-600",
                                          )}
                                          onClick={() => handleUpdatePosition(position.id, { exit_type: "sl" })}
                                        >
                                          SL
                                        </Button>
                                      </div>
                                      {exitedPositions.has(position.id) &&
                                        !position.exit_type &&
                                        exitErrors[position.id.toString()] && (
                                          <div className="text-xs text-red-500 mt-1">{exitErrors[position.id.toString()]}</div>
                                        )}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{position.asset}</TableCell>
                              <TableCell>
                                {typeof position.entry_price === "number" ? position.entry_price.toFixed(5) : "0.00000"}
                              </TableCell>
                              <TableCell>
                                {typeof position.current_price === "number"
                                  ? position.current_price.toFixed(5)
                                  : "0.00000"}
                              </TableCell>
                              <TableCell>{position.tp ? position.tp.toFixed(5) : "—"}</TableCell>
                              <TableCell>{position.sl ? position.sl.toFixed(5) : "—"}</TableCell>
                              <TableCell
                                className={cn(returnPct > 0 ? "text-green-500" : returnPct < 0 ? "text-red-500" : "")}
                              >
                                {typeof returnPct === "number" ? returnPct.toFixed(2) : "0.00"}%
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => viewTradeOnChart(position)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                  >
                                    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                                    <path d="M9 12h6" />
                                    <path d="M15 9l3 3-3 3" />
                                  </svg>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </ErrorBoundary>
      </SidebarInset>
    </SidebarProvider>
  )
}

