"use client"

import { LineChartIcon, Loader2 } from "lucide-react"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  TooltipProps,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface Position {
  entry: number
  takeProfit?: number
  stopLoss?: number
  exitPrice?: number
  isLong: boolean
}

interface PriceChartProps {
  asset: string
  position: Position | null
  onEntryTimeChange?: (time: string) => void
  onExitTimeChange?: (time: string) => void
  onExitTypeChange?: (type: "tp" | "sl" | "partial") => void
  onEntryPriceChange?: (price: number) => void
}

interface TickDataPoint {
  time: string
  price: number
  fullTime: string
  interval?: string
}

const TIMEFRAMES = ["1m", "15m", "30m", "1h", "6h", "1d"]
const DATA_POINTS = 100

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const interval = payload[0]?.payload?.interval || '1m';
    let formattedTime = '';
    
    if (payload[0]?.payload?.fullTime) {
      const date = new Date(payload[0].payload.fullTime);
      
      // Format based on timeframe
      if (interval === '1d') {
        formattedTime = date.toLocaleDateString();
      } else if (interval === '6h' || interval === '1h') {
        formattedTime = date.toLocaleString(undefined, {
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        formattedTime = date.toLocaleString();
      }
    } else {
      formattedTime = label;
    }
    
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-xs font-medium">Time</span>
            <span className="text-xs">{formattedTime}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium">Price</span>
            <span className="text-xs">{payload[0]?.value?.toFixed(5)}</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export function PriceChart({ 
  asset, 
  position, 
  onEntryTimeChange, 
  onExitTimeChange,
  onExitTypeChange,
  onEntryPriceChange
}: PriceChartProps) {
  const [chartData, setChartData] = useState<TickDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [timeframe, setTimeframe] = useState("1h")
  const [entryPoint, setEntryPoint] = useState<{index: number, time: string, price: number} | null>(null)
  const [exitPoint, setExitPoint] = useState<{index: number, time: string, price: number} | null>(null)
  const [chartMode, setChartMode] = useState<"view" | "entry" | "exit">("view")
  const [exitType, setExitType] = useState<"tp" | "sl" | "partial">("tp")

  // Fetch tick data based on selected timeframe
  const fetchTickData = useCallback(async () => {
    try {
      setLoading(true)
      console.log("Fetching tick data for timeframe:", timeframe, "asset:", asset || "EUR/USD");
      
      const response = await fetch(`/api/tickdata?timeframe=${timeframe}&limit=${DATA_POINTS}`)
      const data = await response.json()
      
      console.log("Tick data response:", data);
      
      if (data.success && Array.isArray(data.data)) {
        setChartData(data.data.map((tick: any, index: number) => {
          // Format time display based on timeframe
          let displayTime = tick.time.substring(11, 16); // Default HH:MM
          
          if (timeframe === "1d") {
            displayTime = tick.time.substring(5, 10); // MM-DD for daily
          } else if (timeframe === "6h") {
            displayTime = tick.time.substring(5, 10) + " " + tick.time.substring(11, 13) + "h"; // MM-DD HH
          } else if (timeframe === "1h" || timeframe === "30m" || timeframe === "15m") {
            displayTime = tick.time.substring(11, 16); // HH:MM for hourly and sub-hourly
          }
          
          return {
            time: displayTime,
            price: parseFloat(tick.price) || 0,
            fullTime: tick.time, // Keep full timestamp for reference
            interval: timeframe // Store the interval/timeframe
          }
        }))
      } else {
        console.error("Invalid tick data format:", data);
        // Set some default data if nothing is returned
        setChartData([
          { time: "00:00", price: 1.085, fullTime: "2023-01-01 00:00:00", interval: timeframe },
          { time: "02:00", price: 1.0862, fullTime: "2023-01-01 02:00:00", interval: timeframe },
          { time: "04:00", price: 1.092, fullTime: "2023-01-01 04:00:00", interval: timeframe },
          // ... rest of the mock data
        ])
      }
    } catch (error) {
      console.error("Failed to fetch tick data:", error);
      // Set some default data if the fetch fails
      setChartData([
        { time: "00:00", price: 1.085, fullTime: "2023-01-01 00:00:00", interval: timeframe },
        { time: "02:00", price: 1.0862, fullTime: "2023-01-01 02:00:00", interval: timeframe },
        { time: "04:00", price: 1.092, fullTime: "2023-01-01 04:00:00", interval: timeframe },
        // ... rest of the mock data
      ])
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  // Initial data load
  useEffect(() => {
    fetchTickData()
  }, [fetchTickData])

  // Calculate chart boundaries
  const minPrice = chartData.length ? Math.min(...chartData.map((d) => d.price)) : 0
  const maxPrice = chartData.length ? Math.max(...chartData.map((d) => d.price)) : 0
  const priceRange = maxPrice - minPrice
  const yDomain = [minPrice - priceRange * 0.1, maxPrice + priceRange * 0.1]

  // Handle chart click for entry/exit point placement
  const handleChartClick = useCallback((data: any) => {
    if (!data || !data.activePayload || chartMode === "view") return
    
    const clickedPointIndex = data.activePayload[0]?.payload?.index
    const clickedPoint = data.activePayload[0]?.payload
    
    if (clickedPointIndex === undefined || !clickedPoint) return
    
    if (chartMode === "entry") {
      setEntryPoint({
        index: clickedPointIndex,
        time: clickedPoint.fullTime,
        price: clickedPoint.price
      })
      
      // Notify parent components
      if (onEntryTimeChange) {
        onEntryTimeChange(clickedPoint.fullTime)
      }
      
      if (onEntryPriceChange) {
        onEntryPriceChange(clickedPoint.price)
      }
      
      // Automatically switch to exit mode after placing entry
      setChartMode("exit")
    } else if (chartMode === "exit") {
      setExitPoint({
        index: clickedPointIndex,
        time: clickedPoint.fullTime,
        price: clickedPoint.price
      })
      
      // Notify parent component about exit time change
      if (onExitTimeChange) {
        onExitTimeChange(clickedPoint.fullTime)
      }
      
      // Notify parent about the selected exit type
      if (onExitTypeChange) {
        onExitTypeChange(exitType)
      }
      
      // Switch back to view mode after placing exit
      setChartMode("view")
    }
  }, [chartMode, onEntryTimeChange, onExitTimeChange, onExitTypeChange, onEntryPriceChange, exitType])

  // Add index to chart data for easier reference
  const indexedChartData = chartData.map((point, index) => ({
    ...point,
    index
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>{(asset || "EUR/USD").toUpperCase()}</CardTitle>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          {/* Timeframe selection buttons */}
          {TIMEFRAMES.map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTimeframe(tf)
                // We no longer reset entry/exit points on timeframe change
              }}
            >
              {tf}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Mode selection buttons */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={chartMode === "entry" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartMode("entry")}
              className={chartMode === "entry" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            >
              Entry
            </Button>
            <Button
              variant={chartMode === "exit" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartMode("exit")}
              className={chartMode === "exit" ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
            >
              Exit
            </Button>
            <Button
              variant={chartMode === "view" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartMode("view")}
            >
              View Mode
            </Button>
          </div>
          
          {/* Exit type selector */}
          {chartMode === "exit" && (
            <RadioGroup 
              value={exitType} 
              onValueChange={(val: string) => setExitType(val as "tp" | "sl" | "partial")}
              className="flex items-center space-x-2"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="tp" id="tp" className="text-green-500" />
                <Label htmlFor="tp" className="text-sm">TP</Label>
              </div>
              
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="partial" id="partial" className="text-yellow-500" />
                <Label htmlFor="partial" className="text-sm">Partial</Label>
              </div>
              
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="sl" id="sl" className="text-red-500" />
                <Label htmlFor="sl" className="text-sm">SL</Label>
              </div>
            </RadioGroup>
          )}
        </div>
      
        <div className={cn(
          "h-[400px] w-full cursor-pointer [&_.recharts-cartesian-grid-horizontal]:!stroke-border [&_.recharts-cartesian-grid-vertical]:!stroke-border [&_.recharts-cartesian-axis-line]:!stroke-border [&_.recharts-cartesian-axis-tick-line]:!stroke-border [&_.recharts-cartesian-axis-tick-value]:!fill-muted-foreground",
          chartMode !== "view" && "cursor-crosshair"
        )}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={indexedChartData} 
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" className="!stroke-border/30" />
                <XAxis
                  dataKey="time"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  // Adjust interval based on timeframe
                  interval={timeframe === "1m" ? 9 : timeframe === "15m" ? 4 : timeframe === "30m" ? 2 : 0}
                  // Add domain to fix time scale issues
                  domain={['dataMin', 'dataMax']}
                  // Format ticks to show appropriate level of detail
                  tickFormatter={(value) => {
                    if (timeframe === "1d") {
                      return value; // MM-DD format
                    } else if (timeframe === "6h") {
                      return value; // MM-DD HH format
                    } else {
                      return value; // HH:MM format for smaller timeframes
                    }
                  }}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.toFixed(4)}
                  domain={yDomain}
                  tickCount={6}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  className="!stroke-primary"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, className: "!fill-primary" }}
                />

                {/* Entry Point */}
                {entryPoint !== null && (
                  <ReferenceDot
                    x={chartData[entryPoint.index]?.time}
                    y={entryPoint.price}
                    r={6}
                    fill="#22c55e"
                    stroke="none"
                    label={{
                      value: "Entry",
                      position: "top",
                      fill: "#22c55e",
                    }}
                  />
                )}

                {/* Exit Point */}
                {exitPoint !== null && (
                  <ReferenceDot
                    x={chartData[exitPoint.index]?.time}
                    y={exitPoint.price}
                    r={6}
                    fill={
                      exitType === "tp" ? "#22c55e" : 
                      exitType === "sl" ? "#ef4444" : 
                      "#eab308"  // Yellow for partial
                    }
                    stroke="none"
                    label={{
                      value: exitType.toUpperCase(),
                      position: "top",
                      fill: exitType === "tp" ? "#22c55e" : 
                            exitType === "sl" ? "#ef4444" : 
                            "#eab308"
                    }}
                  />
                )}

                {/* Position Entry Point */}
                {position && (
                  <>
                    <ReferenceDot
                      y={position.entry}
                      x={chartData[Math.floor(chartData.length / 3)].time}
                      r={6}
                      fill={position.isLong ? "#22c55e" : "#ef4444"}
                      stroke="none"
                    />

                    {/* Take Profit Level */}
                    {position.takeProfit && (
                      <ReferenceLine
                        y={position.takeProfit}
                        stroke="#22c55e"
                        strokeDasharray="3 3"
                        label={{
                          value: "TP",
                          position: "right",
                          fill: "#22c55e",
                        }}
                      />
                    )}

                    {/* Stop Loss Level */}
                    {position.stopLoss && (
                      <ReferenceLine
                        y={position.stopLoss}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        label={{
                          value: "SL",
                          position: "right",
                          fill: "#ef4444",
                        }}
                      />
                    )}

                    {/* Exit Point */}
                    {position.exitPrice && (
                      <ReferenceDot
                        y={position.exitPrice}
                        x={chartData[Math.floor(chartData.length * 0.75)].time}
                        r={6}
                        fill={position.exitPrice >= position.entry ? "#22c55e" : "#ef4444"}
                        stroke="none"
                      />
                    )}
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </div>
          )}
        </div>
        
        {/* Instructions based on mode */}
        <div className="mt-2 text-center text-sm text-muted-foreground">
          {chartMode === "entry" && "Click on the chart to place your entry point"}
          {chartMode === "exit" && "Click on the chart to place your exit point"}
        </div>
      </CardContent>
    </Card>
  )
}

