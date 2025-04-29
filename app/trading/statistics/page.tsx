"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { TradingSessions } from "@/components/trading-sessions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Legend } from "recharts"
import { useTradeData } from '@/lib/cache/TradeDataProvider'

function calculateHistogram(data: number[], binCount: number = 50): { x: number; y: number; theoretical: number }[] {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min
  const binSize = range / binCount
  const totalTrades = data.length

  const mean = data.reduce((a, b) => a + b, 0) / data.length
  const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length
  const stdDev = Math.sqrt(variance)

  const bins = new Array(binCount).fill(0)
  const binEdges = new Array(binCount + 1).fill(0).map((_, i) => min + i * binSize)

  data.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1)
    bins[binIndex]++
  })

  return bins.map((count, i) => {
    const x = (binEdges[i] + binEdges[i + 1]) / 2
    const z = (x - mean) / stdDev
    const theoreticalDensity = Math.exp(-0.5 * z * z) / (stdDev * Math.sqrt(2 * Math.PI))
    const theoretical = (theoreticalDensity * binSize * totalTrades / totalTrades) * 100

    return {
      x,
      y: (count / totalTrades) * 100,
      theoretical
    }
  })
}

export default function TradingStatisticsPage() {
  const [selectedType, setSelectedType] = useState<"REAL" | "PAPER" | "ALL">("REAL")
  const [selectedPeriod, setSelectedPeriod] = useState<"3m" | "6m" | "12m" | "all">("all")
  
  const { useTradesData } = useTradeData()
  const { data: tradesData, isLoading: tradesLoading } = useTradesData(selectedType)

  const renderReturnsDistribution = () => {
    if (tradesLoading || !tradesData) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    let filteredTrades = [...tradesData.trades]
    
    if (selectedPeriod !== "all") {
      const now = new Date()
      const months = parseInt(selectedPeriod)
      const cutoffDate = new Date(now.setMonth(now.getMonth() - months))
      filteredTrades = filteredTrades.filter(trade => new Date(trade.date) >= cutoffDate)
    }

    if (filteredTrades.length === 0) {
      return <div className="flex items-center justify-center h-[300px]">No data available</div>
    }

    const returns = filteredTrades
      .map(trade => trade.result)
      .filter((result): result is number => result !== null)

    if (returns.length === 0) {
      return <div className="flex items-center justify-center h-[300px]">No valid returns data</div>
    }

    const histogramData = calculateHistogram(returns)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const sortedReturns = [...returns].sort((a, b) => a - b)
    const median = sortedReturns[Math.floor(sortedReturns.length / 2)]

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={histogramData}>
          <defs>
            <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorTheoretical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="x"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
            className="text-xs"
            domain={['dataMin', 'dataMax']}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            className="text-xs"
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border rounded-md shadow-md p-3 text-xs">
                    <p className="font-medium">Return: {(payload[0].payload.x * 100).toFixed(2)}%</p>
                    <p className="text-muted-foreground">Actual Frequency: {payload[0].payload.y.toFixed(1)}%</p>
                    <p className="text-muted-foreground">Theoretical: {payload[0].payload.theoretical.toFixed(1)}%</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorHist)"
            fillOpacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="theoretical"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#colorTheoretical)"
            fillOpacity={0.3}
          />
          <ReferenceLine
            x={mean}
            stroke="#10b981"
            strokeDasharray="3 3"
            label={{
              value: `Mean: ${(mean * 100).toFixed(2)}%`,
              position: 'top',
              fill: '#10b981',
              fontSize: 12
            }}
          />
          <ReferenceLine
            x={median}
            stroke="#8b5cf6"
            strokeDasharray="3 3"
            label={{
              value: `Median: ${(median * 100).toFixed(2)}%`,
              position: 'top',
              fill: '#8b5cf6',
              fontSize: 12
            }}
          />
          <Legend />
        </AreaChart>
      </ResponsiveContainer>
    )
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
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Returns Distribution</CardTitle>
                <CardDescription>Distribution of trade returns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Select
                      value={selectedType}
                      onValueChange={(value: "REAL" | "PAPER" | "ALL") => setSelectedType(value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REAL">Real Trades</SelectItem>
                        <SelectItem value="PAPER">Paper Trades</SelectItem>
                        <SelectItem value="ALL">All Trades</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedPeriod}
                      onValueChange={(value: "3m" | "6m" | "12m" | "all") => setSelectedPeriod(value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3m">Last 3 Months</SelectItem>
                        <SelectItem value="6m">Last 6 Months</SelectItem>
                        <SelectItem value="12m">Last 12 Months</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {renderReturnsDistribution()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Risk/Reward Distribution</CardTitle>
                <CardDescription>Trade risk metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg bg-muted" />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Trade Duration</CardTitle>
                <CardDescription>Holding period analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-lg bg-muted" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Position Sizing</CardTitle>
                <CardDescription>Risk management analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-lg bg-muted" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Trade Distribution</CardTitle>
                <CardDescription>Trading patterns analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-lg bg-muted" />
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

