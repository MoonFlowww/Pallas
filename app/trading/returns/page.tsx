"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Line, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppSidebar } from "@/components/app-sidebar"
import { TradingSessions } from "@/components/trading-sessions"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { TimeframeTable } from "@/components/timeframe-table"
import { toast } from "sonner"
import { useTradeData } from '@/lib/cache/TradeDataProvider'

type ChartType = "equity" | "barGainLoss" | "logScale"

interface ReturnsData {
  trade_date: string
  daily_return: number
  trade_count: number
  cumulative_return: number
  benchmark_return: number
  benchmark_cumulative_return: number
  avg_daily_return: number
  daily_return_stddev: number
  max_drawdown: number
  winning_days: number
  losing_days: number
}

interface Metrics {
  totalTrades: number
  tradingDays: number
  winRate: number
  winRateTP: number
  totalReturn: number
  avgReturnPerTrade: number
  avgDailyReturn: number
  maxDrawdown: number
  avgDrawdown: number
  mad: number
  madDownside: number
  recoveryMDD: number
  recoveryDD: number
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  cagr: number
  omegaRatio: number
  kellyCriterion: number
  upi: number
  alpha: number
  beta: number
  correlation: number
  avgRisk: number
  avgHedge: number
  avgPositiveHedge: number
  winning_days: number
  losing_days: number
  rachevRatio: number
  cVaR95: number
  skew: number
  kurtosis: number
  kurtosisPositive: number
  kurtosisNegative: number
  kurtosisRatio: number
  cornishFisher: number
  var95: number
  ftti: number
}

interface TimeframeData {
  daily: any[]
  weekly: any[]
  monthly: any[]
  quarterly: any[]
  annually: any[]
}

export default function TradingReturnsPage() {
  const [chartType, setChartType] = useState<ChartType>("equity")
  const [dataPoints, setDataPoints] = useState("0")
  const [showPercent, setShowPercent] = useState(false)
  const [selectedType, setSelectedType] = useState<"REAL" | "PAPER" | "ALL">("REAL")
  
  const { useEquityCurveData, useMetricsData, useTimeframeData } = useTradeData()
  
  const { data: returnsData, isLoading: equityLoading } = useEquityCurveData(selectedType, dataPoints)
  const { data: metrics, isLoading: metricsLoading } = useMetricsData(selectedType, dataPoints)
  const { data: timeframeData, isLoading: timeframeLoading } = useTimeframeData(selectedType)
  
  const renderChart = () => {
    if (equityLoading) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    const valueKey = showPercent ? "cumulative_return" : "cumulative_return"
    const benchmarkKey = showPercent ? "benchmark_cumulative_return" : "benchmark_cumulative_return"
    const formatValue = (value: number) => (showPercent ? `${value.toFixed(2)}%` : `$${(value / 100 * 10000).toFixed(1)}`)

    // Find min and max values for proper domain calculation
    const minValue = returnsData.length > 0 ? 
      Math.min(...returnsData.map(d => d.cumulative_return)) : 0;
    const maxValue = returnsData.length > 0 ? 
      Math.max(...returnsData.map(d => d.cumulative_return)) : 0;

    // Determine if we should force the Y-axis to start at 0
    const yAxisMin = showPercent ? 0 : Math.min(0, minValue * 0.95);
    const yAxisMax = showPercent ? Math.max(maxValue * 1.05, 1) : Math.max(maxValue * 1.05, 1);

    // Calculate peak values for drawdown visualization (high water mark)
    let peakValue = 0;
    const dataWithPeaks = returnsData.map(point => {
      if (point.cumulative_return > peakValue) {
        peakValue = point.cumulative_return;
      }
      return {
        ...point,
        peak_value: peakValue
      };
    });

    // Custom tooltip component for shadcn-like styling
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const equityValue = payload[0].value;
        
        return (
          <div className="bg-background border rounded-md shadow-md p-3 text-xs">
            <p className="font-medium text-foreground">{new Date(label).toLocaleDateString()}</p>
            <div className="mt-2 space-y-1">
              <p className="text-blue-500 flex items-center">
                <span className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                Equity: {formatValue(equityValue)}
              </p>
              {payload[0].payload.daily_return && (
                <p className={`text-foreground mt-1 pt-1 border-t ${payload[0].payload.daily_return < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  Daily return: {payload[0].payload.daily_return.toFixed(2)}%
                </p>
              )}
              {payload[0].payload.trade_count > 0 && (
                <p className="text-muted-foreground">
                  Trades: {payload[0].payload.trade_count}
                </p>
              )}
            </div>
          </div>
        );
      }
      return null;
    };

    switch (chartType) {
      case "equity":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dataWithPeaks}>
              <defs>
                <linearGradient id="equityColorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="trade_date"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
                className="text-xs"
                domain={[yAxisMin, yAxisMax]}
                allowDataOverflow={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* High Water Mark (Peak Line) */}
              <Area
                name="Peak"
                type="monotone"
                dataKey="peak_value"
                stroke="#14b8a6"  // teal-500
                strokeWidth={1}
                fill="none"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
              {/* Equity Curve */}
              <Area
                name="Equity Curve"
                type="monotone"
                dataKey={valueKey}
                stroke="#3b82f6"
                fill="url(#equityColorGradient)"
                strokeWidth={2}
              />
              <Line
                name="EURUSD Benchmark"
                type="monotone"
                dataKey={benchmarkKey}
                stroke="#475569"
                strokeWidth={1.5}
              />
              <Legend wrapperStyle={{ marginTop: "-15px" }} />
            </AreaChart>
          </ResponsiveContainer>
        )
      case "barGainLoss":
        return (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={returnsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="trade_date"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  className="text-xs"
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  className="text-xs"
                  domain={[0, 'auto']} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  name="Gains"
                  type="monotone"
                  dataKey={(data) => data.daily_return > 0 ? data.daily_return : 0}
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Area
                  name="Losses"
                  type="monotone"
                  dataKey={(data) => data.daily_return < 0 ? -data.daily_return : 0}
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Legend wrapperStyle={{ marginTop: "-15px" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )
      case "logScale":
        // Log scale chart for better visualization of compound returns
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dataWithPeaks}>
              <defs>
                <linearGradient id="logScaleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="trade_date"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
                className="text-xs"
                scale="log"
                domain={['auto', 'auto']}
                allowDataOverflow={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                name="Equity Curve (Log Scale)"
                type="monotone"
                dataKey={(data) => Math.max(data[valueKey] + 100, 0.1)} // Add 100 to make all values positive for log scale
                stroke="#8b5cf6"
                fill="url(#logScaleGradient)"
                strokeWidth={2}
              />
              <Line
                name="EURUSD Benchmark"
                type="monotone"
                dataKey={(data) => Math.max(data[benchmarkKey] + 100, 0.1)}
                stroke="#475569"
                strokeWidth={1.5}
              />
              <Legend wrapperStyle={{ marginTop: "-15px" }} />
            </AreaChart>
          </ResponsiveContainer>
        )
    }
  }

  const performanceMetrics = metrics ? [
    {
      category: "Performance",
      color: "bg-blue-500",
      metrics: [
        { name: "CAGR:", value: `${metrics?.cagr?.toFixed(2) || '0.00'}%`, color: "text-blue-500" },
        { name: "~R:", value: `${metrics?.avgReturnPerTrade?.toFixed(2) || '0.00'}%`, color: "text-blue-500" },
        { name: "WR:", value: `${metrics?.winRateTP?.toFixed(1) || '0.0'}%`, color: "text-blue-500" },
        { name: "WR+:", value: `${metrics?.winRate?.toFixed(1) || '0.0'}%`, color: "text-blue-500" },
        { name: "Omega:", value: `${metrics?.omegaRatio?.toFixed(2) || '0.00'}`, color: "text-blue-500" },
      ],
    },
    {
      category: "Risks",
      color: "bg-red-500",
      metrics: [
        { name: "MDD:", value: `${metrics?.maxDrawdown?.toFixed(2) || '0.00'}%`, color: "text-red-500" },
        { name: "~DD:", value: `${metrics?.avgDrawdown?.toFixed(2) || '0.00'}%`, color: "text-red-500" },
        { name: "VaR:", value: `${Math.abs(metrics?.var95 || 0).toFixed(2)}%`, color: "text-red-500" },
        { name: "CVaR:", value: `${Math.abs(metrics?.cVaR95 || 0).toFixed(2)}%`, color: "text-red-500" },
        { name: "CFE:", value: `${Math.abs(metrics?.cornishFisher || 0).toFixed(2)}%`, color: "text-red-500" },
      ],
    },
    {
      category: "Risk-Adjusted",
      color: "bg-green-500",
      metrics: [
        { name: "Sharpe:", value: metrics?.sharpeRatio?.toFixed(2) || '0.00', color: "text-green-500" },
        { name: "Sortino:", value: metrics?.sortinoRatio?.toFixed(2) || '0.00', color: "text-green-500" },
        { name: "Calmar:", value: metrics?.calmarRatio?.toFixed(2) || '0.00', color: "text-green-500" },
        { name: "Rachev:", value: metrics?.rachevRatio?.toFixed(2) || '0.00', color: "text-green-500" },
        { name: "UPI:", value: metrics?.upi?.toFixed(2) || '0.00', color: "text-green-500" },
      ],
    },
    {
      category: "Additionals",
      color: "bg-purple-500",
      metrics: [
        { name: "Alpha:", value: `${(metrics?.alpha || 0).toFixed(2)}%`, color: "text-purple-500" },
        { name: "Beta:", value: metrics?.beta?.toFixed(2) || '0.00', color: "text-purple-500" },
        { name: "Kelly:", value: `${(metrics?.kellyCriterion || 0).toFixed(1)}%`, color: "text-purple-500" },
        { name: "Recovery:", value: metrics?.recoveryMDD?.toFixed(2) || '0.00', color: "text-purple-500" },
        { name: "Rec ~DD:", value: metrics?.recoveryDD?.toFixed(2) || '0.00', color: "text-purple-500" },
      ],
    },
    {
      category: "Distribution",
      color: "bg-amber-500",
      isColumnLayout: true,
      metrics: [
        { name: "Skew:", value: metrics?.skew?.toFixed(3) || '0.000', color: "text-amber-500" },
        { name: "Kurt+:", value: metrics?.kurtosisPositive?.toFixed(3) || '0.000', color: "text-amber-500" },
        { name: "Kurt-:", value: metrics?.kurtosisNegative?.toFixed(3) || '0.000', color: "text-amber-500" },
        { name: "FTTI:", value: metrics?.ftti?.toFixed(3) || '0.000', color: "text-amber-500" },
      ],
    }
  ] : []

  // Utility function to format metric values
  const formatNumber = (value: number | undefined, type: 'percent' | 'decimal', decimals: number = 2): string => {
    if (value === undefined) return '0.00';
    
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    
    const formattedValue = formatter.format(value);
    return type === 'percent' ? `${formattedValue}%` : formattedValue;
  };

  // Setup metrics cards based on api data
  const [metricCards, setMetricCards] = useState({
    columns: [
      {
        title: "Risk & Return",
        metrics: [
          { label: "~R:", value: "" },
          { label: "CAGR:", value: "" },
          { label: "MDD:", value: "" },
          { label: "Avg Daily:", value: "" },
          { label: "Total Return:", value: "" },
          { label: "Win Rate:", value: "" },
        ],
      },
      {
        title: "Ratios",
        metrics: [
          { label: "Sharpe:", value: "" },
          { label: "Sortino:", value: "" },
          { label: "Kelly:", value: "" },
          { label: "Calmar:", value: "" },
          { label: "UPI:", value: "" },
          { label: "MAD:", value: "" },
        ],
      },
      {
        title: "Distribution",
        isColumnLayout: true,
        metrics: [
          { label: "Skew:", value: "" },
          { label: "Kurt+:", value: "" },
          { label: "Kurt-:", value: "" },
          { label: "FTTI:", value: "" },
          { label: "CFE:", value: "" },
          { label: "Kurtosis:", value: "" },
        ],
      },
    ] as {
      title: string;
      isColumnLayout?: boolean;
      metrics: { label: string; value: string }[];
    }[],
  });

  useEffect(() => {
    if (metrics) {
      setMetricCards({
        columns: [
          {
            title: "Risk & Return",
            metrics: [
              { label: "~R:", value: formatNumber(metrics.avgReturnPerTrade, "percent", 2) },
              { label: "CAGR:", value: formatNumber(metrics.cagr, "percent", 2) },
              { label: "MDD:", value: formatNumber(metrics.maxDrawdown, "percent", 2) },
              { label: "Avg Daily:", value: formatNumber(metrics.avgDailyReturn, "percent", 2) },
              { label: "Total Return:", value: formatNumber(metrics.totalReturn, "percent", 2) },
              { label: "Win Rate:", value: formatNumber(metrics.winRate, "percent", 2) },
            ],
          },
          {
            title: "Ratios",
            metrics: [
              { label: "Sharpe:", value: formatNumber(metrics.sharpeRatio, "decimal", 2) },
              { label: "Sortino:", value: formatNumber(metrics.sortinoRatio, "decimal", 2) },
              { label: "Kelly:", value: formatNumber(metrics.kellyCriterion, "percent", 2) },
              { label: "Calmar:", value: formatNumber(metrics.calmarRatio, "decimal", 2) },
              { label: "UPI:", value: formatNumber(metrics.upi, "decimal", 2) },
              { label: "MAD:", value: formatNumber(metrics.mad, "percent", 2) },
            ],
          },
          {
            title: "Distribution",
            isColumnLayout: true,
            metrics: [
              { label: "Skew:", value: formatNumber(metrics.skew, "decimal", 3) },
              { label: "Kurt+:", value: formatNumber(metrics.kurtosisPositive, "decimal", 3) },
              { label: "Kurt-:", value: formatNumber(metrics.kurtosisNegative, "decimal", 3) },
              { label: "FTTI:", value: formatNumber(metrics.ftti, "decimal", 3) },
              { label: "CFE:", value: formatNumber(metrics.cornishFisher, "percent", 2) },
              { label: "Kurtosis:", value: formatNumber(metrics.kurtosis, "decimal", 3) },
            ],
          },
        ] as {
          title: string;
          isColumnLayout?: boolean;
          metrics: { label: string; value: string }[];
        }[],
      });
    }
  }, [metrics]);

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
          <div className="flex items-center justify-between">
            <Tabs value={selectedType} onValueChange={(value: string) => setSelectedType(value as "REAL" | "PAPER" | "ALL")}>
              <TabsList>
                <TabsTrigger value="REAL" className="min-w-24">
                  Real
                </TabsTrigger>
                <TabsTrigger value="PAPER" className="min-w-24">
                  Demo
                </TabsTrigger>
                <TabsTrigger value="ALL" className="min-w-24">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-4">
                  <CardTitle>Overview</CardTitle>
                  <Select value={dataPoints} onValueChange={setDataPoints}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Data points" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">1 month</SelectItem>
                      <SelectItem value="180">6 months</SelectItem>
                      <SelectItem value="365">12 months</SelectItem>
                      <SelectItem value="0">All trades</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">$</span>
                    <Switch checked={showPercent} onClick={() => setShowPercent(!showPercent)} />
                    <span className="text-sm">%</span>
                  </div>
                </div>
                <Tabs value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
                  <TabsList>
                    <TabsTrigger value="equity">Equity Curve</TabsTrigger>
                    <TabsTrigger value="barGainLoss">Gain/Loss</TabsTrigger>
                    <TabsTrigger value="logScale">Log Scale</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div style={{ width: "750px", minWidth: "100%" }}>{renderChart()}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {performanceMetrics.map((category) => (
                      <div key={category.category} className={cn("space-y-2", category.isColumnLayout && "col-span-4")}>
                        <h3 className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                          <div className={cn("h-2 w-2 rounded-full", category.color)} />
                          {category.category}
                        </h3>
                        <div className={cn(
                          "space-y-1", 
                          category.isColumnLayout && "grid grid-cols-4 gap-4 space-y-0"
                        )}>
                          {category.metrics.map((metric) => (
                            <div
                              key={metric.name}
                              className="flex items-center justify-between rounded-lg border p-2 hover:bg-muted/50 transition-colors"
                            >
                              <div className="text-xs font-medium mr-2">{metric.name}</div>
                              <div className={cn("font-mono text-sm", metric.color)}>{metric.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <TimeframeTable data={timeframeData || undefined} loading={timeframeLoading} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

