"use client"

import { useState, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { TradingSessions } from "@/components/trading-sessions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
  Line,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
} from "recharts"

export default function TradingProbabilitiesPage() {
  const [chartType, setChartType] = useState<"mahalanobis" | "mle" | "kalman">("mahalanobis")

  // Generate sample data for tail inequalities and approximation estimates
  const kalmanData = useMemo(() => {
    const baseData = Array.from({ length: 100 }, (_, i) => {
      const x = i / 10
      const trueValue = 50 + 10 * Math.sin(x)
      const noise = 5 * (Math.random() - 0.5)
      const measurement = trueValue + noise

      // Calculate tail inequality (Chebyshev's inequality)
      const tailBound = 15 / Math.sqrt(i + 1) // Theoretical upper bound

      // Calculate approximation estimate (Kalman filter estimate)
      const kalmanGain = i / (i + 1)
      const estimate = kalmanGain * measurement + (1 - kalmanGain) * trueValue

      // Calculate confidence intervals
      const confidenceInterval = 2 * Math.sqrt(1 / (i + 1))

      return {
        time: x,
        trueValue,
        measurement,
        tailBound: trueValue + tailBound,
        lowerTailBound: trueValue - tailBound,
        estimate,
        upperBound: estimate + confidenceInterval,
        lowerBound: estimate - confidenceInterval,
      }
    })
    return baseData
  }, [])

  const mahalanobisData = Array.from({ length: 50 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random(),
    group: Math.random() > 0.5 ? "A" : "B",
  }))

  const mleData = Array.from({ length: 30 }, (_, i) => ({
    value: Math.random() * 100,
    frequency: Math.random() * 20,
    kde: 15 * Math.exp((-(i - 15) * (i - 15)) / 50),
  }))

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
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Success Probability</CardTitle>
                <CardDescription>Trade outcome prediction</CardDescription>
              </div>
              <ButtonGroup>
                <Button
                  variant={chartType === "mahalanobis" ? "default" : "outline"}
                  onClick={() => setChartType("mahalanobis")}
                >
                  Mahalanobis
                </Button>
                <Button variant={chartType === "mle" ? "default" : "outline"} onClick={() => setChartType("mle")}>
                  MLE
                </Button>
                <Button variant={chartType === "kalman" ? "default" : "outline"} onClick={() => setChartType("kalman")}>
                  Kalman
                </Button>
              </ButtonGroup>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full [&_.recharts-tooltip-wrapper]:!pointer-events-none">
                <style jsx global>{`
                  .recharts-tooltip-wrapper .recharts-default-tooltip {
                    background-color: hsl(var(--background)) !important;
                    border: 1px solid hsl(var(--border)) !important;
                    color: hsl(var(--foreground)) !important;
                  }
                  .recharts-tooltip-wrapper .recharts-default-tooltip .recharts-tooltip-label {
                    color: hsl(var(--muted-foreground)) !important;
                  }
                  .recharts-tooltip-wrapper .recharts-default-tooltip .recharts-tooltip-item {
                    color: hsl(var(--foreground)) !important;
                  }
                `}</style>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "mahalanobis" ? (
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Distance"
                        label={{ value: "Distance", position: "bottom" }}
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Volatility"
                        label={{ value: "Volatility", angle: -90, position: "left" }}
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <ZAxis type="number" dataKey="z" range={[50, 400]} name="Correlation" />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{ backgroundColor: "transparent", border: "none" }}
                        formatter={(value, name) => {
                          const label = {
                            x: "Distance",
                            y: "Volatility",
                            z: "Correlation",
                          }[name]
                          return [`${value.toFixed(3)}`, label]
                        }}
                        labelFormatter={(label) => "Point Data"}
                      />
                      <Legend />
                      <Scatter
                        name="Group A"
                        data={mahalanobisData.filter((d) => d.group === "A")}
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Scatter name="Group B" data={mahalanobisData.filter((d) => d.group === "B")} fill="#82ca9d" />
                    </ScatterChart>
                  ) : chartType === "mle" ? (
                    <ComposedChart data={mleData}>
                      <XAxis dataKey="value" tickFormatter={(value) => value.toFixed(1)} />
                      <YAxis yAxisId="left" tickFormatter={(value) => value.toFixed(1)} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => value.toFixed(1)} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "transparent", border: "none" }}
                        formatter={(value, name) => {
                          const label = {
                            frequency: "Frequency",
                            kde: "Density Estimation",
                          }[name]
                          return [`${value.toFixed(3)}`, label]
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="frequency" fill="#8884d8" opacity={0.8} name="Histogram" />
                      <Line yAxisId="right" type="monotone" dataKey="kde" stroke="#ff7300" name="KDE" strokeWidth={2} />
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={kalmanData}>
                      <XAxis
                        dataKey="time"
                        name="Time"
                        label={{ value: "Time", position: "bottom" }}
                        tickFormatter={(value) => value.toFixed(1)}
                        ticks={Array.from({ length: 11 }, (_, i) => i)}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tickFormatter={(value) => value.toFixed(1)}
                        label={{ value: "Value", angle: -90, position: "left" }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "transparent", border: "none" }}
                        formatter={(value, name) => {
                          const label = {
                            trueValue: "True Value",
                            measurement: "Measurement",
                            estimate: "Kalman Estimate",
                            tailBound: "Upper Tail Bound",
                            lowerTailBound: "Lower Tail Bound",
                            upperBound: "Upper CI",
                            lowerBound: "Lower CI",
                          }[name]
                          return [`${value.toFixed(3)}`, label]
                        }}
                      />
                      <Legend />
                      {/* True value and measurements */}
                      <Line
                        type="monotone"
                        dataKey="trueValue"
                        stroke="hsl(var(--primary))"
                        dot={false}
                        name="True Value"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="measurement"
                        stroke="hsl(var(--muted-foreground))"
                        dot={false}
                        name="Measurement"
                        opacity={0.5}
                      />

                      {/* Tail inequalities */}
                      <Area
                        type="monotone"
                        dataKey="tailBound"
                        stroke="none"
                        fill="hsl(var(--warning))"
                        fillOpacity={0.1}
                        name="Tail Bounds"
                      />
                      <Line
                        type="monotone"
                        dataKey="tailBound"
                        stroke="hsl(var(--warning))"
                        dot={false}
                        strokeDasharray="3 3"
                        name="Upper Tail Bound"
                      />
                      <Line
                        type="monotone"
                        dataKey="lowerTailBound"
                        stroke="hsl(var(--warning))"
                        dot={false}
                        strokeDasharray="3 3"
                        name="Lower Tail Bound"
                      />

                      {/* Kalman estimates and confidence intervals */}
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        stroke="none"
                        fill="hsl(var(--success))"
                        fillOpacity={0.1}
                        name="Confidence Interval"
                      />
                      <Line
                        type="monotone"
                        dataKey="estimate"
                        stroke="hsl(var(--success))"
                        dot={false}
                        strokeWidth={2}
                        name="Kalman Estimate"
                      />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Time Analysis</CardTitle>
                <CardDescription>Time-based probabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-lg bg-muted" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Price Analysis</CardTitle>
                <CardDescription>Price-based probabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-lg bg-muted" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Volume Analysis</CardTitle>
                <CardDescription>Volume-based probabilities</CardDescription>
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

