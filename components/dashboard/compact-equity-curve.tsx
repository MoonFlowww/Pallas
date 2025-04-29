"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTheme } from "next-themes"

const generateEquityData = () => {
  let equityPercent = 0
  return Array.from({ length: 30 }, (_, i) => {
    const dailyReturn = Math.random() * 0.02 - 0.005 // Random return between -0.5% and 1.5%
    equityPercent += dailyReturn * 100 // Accumulate percentage changes
    return {
      date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split("T")[0],
      value: equityPercent,
      return: dailyReturn * 100,
    }
  })
}

export function CompactEquityCurve() {
  const { theme } = useTheme()
  const data = generateEquityData()

  return (
    <div className="aspect-[4/3]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={theme === "dark" ? "rgb(34, 197, 94)" : "rgb(22, 163, 74)"}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={theme === "dark" ? "rgb(34, 197, 94)" : "rgb(22, 163, 74)"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => value.split("-").slice(1).join("/")}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={theme === "dark" ? "rgb(34, 197, 94)" : "rgb(22, 163, 74)"}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Date:</div>
                      <div className="text-sm font-medium">{data.date}</div>
                      <div className="text-sm text-muted-foreground">Equity:</div>
                      <div className="text-sm font-medium">{data.value.toFixed(2)}%</div>
                      <div className="text-sm text-muted-foreground">Return:</div>
                      <div className={`text-sm font-medium ${data.return >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {data.return.toFixed(2)}%
                      </div>
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

