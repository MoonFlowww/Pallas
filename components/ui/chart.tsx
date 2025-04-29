"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CrossAxisChartProps extends React.HTMLAttributes<HTMLDivElement> {
  tickValues?: number[]
}

export function CrossAxisChart({ tickValues = [-3, -2, -1, 0, 1, 2, 3], className, ...props }: CrossAxisChartProps) {
  return (
    <div className={cn("relative h-[600px] w-full", className)} {...props}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path
              d="M 100 0 L 0 0 0 100"
              fill="none"
              stroke="var(--border)"
              strokeWidth="0.5"
              opacity="0.2"
              className="dark:opacity-[0.15]"
            />
          </pattern>
        </defs>

        {/* Grid background */}
        <rect x="0" y="0" width="600" height="600" fill="url(#grid)" className="dark:opacity-80" />

        <g transform="translate(300, 300)">
          {/* Main axes */}
          <line x1={-300} y1={0} x2={300} y2={0} className="stroke-zinc-900 dark:stroke-zinc-50" strokeWidth={1} />
          <line x1={0} y1={-300} x2={0} y2={300} className="stroke-zinc-900 dark:stroke-zinc-50" strokeWidth={1} />

          {/* Ticks and labels */}
          {tickValues.map((value) => (
            <React.Fragment key={`tick-${value}`}>
              {value !== 0 && (
                <>
                  {/* X-axis ticks and labels */}
                  <line
                    x1={value * 100}
                    y1={-5}
                    x2={value * 100}
                    y2={5}
                    className="stroke-zinc-900 dark:stroke-zinc-50"
                    strokeWidth={1}
                  />
                  <text
                    x={value * 100}
                    y={25}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs font-medium"
                  >
                    {value}
                  </text>

                  {/* Y-axis ticks and labels */}
                  <line
                    x1={-5}
                    y1={value * 100}
                    x2={5}
                    y2={value * 100}
                    className="stroke-zinc-900 dark:stroke-zinc-50"
                    strokeWidth={1}
                  />
                  <text
                    x={-20}
                    y={value * 100 + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-xs font-medium"
                  >
                    {-value}
                  </text>

                  {/* Extended lines for each tick value */}
                  <line
                    x1={value * 100}
                    y1={-300}
                    x2={value * 100}
                    y2={300}
                    className="stroke-border"
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                  <line
                    x1={-300}
                    y1={value * 100}
                    x2={300}
                    y2={value * 100}
                    className="stroke-border"
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                </>
              )}
            </React.Fragment>
          ))}
        </g>
      </svg>
    </div>
  )
}

