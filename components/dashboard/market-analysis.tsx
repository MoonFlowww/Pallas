"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTheme } from "next-themes"
import { toast } from "sonner"

interface TickData {
  timestamp: string
  ask: number
}

export function MarketAnalysis() {
  const { theme } = useTheme()
  const [data, setData] = useState<TickData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/market")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch market data")
        }
        setData(result.data)
      } catch (error) {
        console.error("Failed to fetch market data:", error)
        toast.error("Failed to load market data", {
          description: error instanceof Error ? error.message : "Unknown error occurred"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Refresh data every minute
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={theme === "dark" ? "rgb(59, 130, 246)" : "rgb(37, 99, 235)"}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={theme === "dark" ? "rgb(59, 130, 246)" : "rgb(37, 99, 235)"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="timestamp"
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => new Date(value).toLocaleTimeString()}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => value.toFixed(5)}
            domain={['auto', 'auto']} 
          />
          <Area
            type="monotone"
            dataKey="ask"
            stroke={theme === "dark" ? "rgb(59, 130, 246)" : "rgb(37, 99, 235)"}
            fill="url(#gradientArea)"
            strokeWidth={2}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Time:</div>
                      <div className="text-sm font-medium">{new Date(data.timestamp).toLocaleTimeString()}</div>
                      <div className="text-sm text-muted-foreground">Ask:</div>
                      <div className="text-sm font-medium">{data.ask.toFixed(5)}</div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

