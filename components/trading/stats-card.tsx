import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface StatsCardProps {
  stats: {
    return: {
      value: string
      progress: number
      animate: boolean
      entry?: number
      tp?: number
      sl?: number
      partialExit?: number
      isLong?: boolean
      breakEven?: boolean
      exitType?: "tp" | "sl" | "partial" | null
      currentPrice?: number
      riskPercentage?: number
    }
    riskReward: {
      ratio: string
      segments: Array<{ type: string; filled: boolean }>
    }
    maxDrawdown: { value: string; progress: number }
    metrics: Array<{ name: string; value: string; color: string }>
  }
}

function parseNumber(val) {
  console.log("parseNumber input:", val)

  if (typeof val === "string") {
    const parsed = Number.parseFloat(val)
    console.log("parseNumber parsed float:", parsed)
    return isNaN(parsed) ? 0 : parsed
  }

  const isNum = typeof val === "number" && !isNaN(val)
  console.log("parseNumber isNum:", isNum, "value:", val)
  return isNum ? val : 0
}

function calculateReturn(
  entry,
  tp = null,
  sl = null,
  partialExit = null,
  isLong = true,
  breakEven = false,
  exitType = null,
  currentPrice = null,
  riskPercentage = 1,
) {
  console.log("calculateReturn called with:", {
    entry,
    tp,
    sl,
    partialExit,
    isLong,
    breakEven,
    exitType,
    currentPrice,
    riskPercentage,
  })
  const e = parseNumber(entry)
  const t = parseNumber(tp)
  const s = parseNumber(sl)
  const p = parseNumber(partialExit)
  const c = parseNumber(currentPrice)
  console.log("parsed values:", { e, t, s, p, c })

  if (!e) {
    console.log("No valid entry, returning 0")
    return 0
  }

  let finalPrice = c || e // Use current price if available, otherwise entry

  if (exitType === "tp" && t) {
    finalPrice = t
    console.log("exitType tp, finalPrice:", finalPrice)
  } else if (exitType === "sl" && s) {
    finalPrice = s
    console.log("exitType sl, finalPrice:", finalPrice)
  } else if (exitType === "partial" && p) {
    if (breakEven) {
      finalPrice = isLong ? Math.max(p, e) : Math.min(p, e)
      console.log("exitType partial with BE:", finalPrice)
    } else {
      finalPrice = p
      console.log("exitType partial no BE:", finalPrice)
    }
  }

  // Calculate base return percentage
  const priceChange = finalPrice - e
  const baseReturnPct = (priceChange / e) * 100
  console.log("baseReturnPct:", baseReturnPct)

  // Apply direction based on long/short
  const directedReturn = isLong ? baseReturnPct : -baseReturnPct
  console.log("directedReturn:", directedReturn)

  // Apply risk percentage
  const result = (directedReturn * riskPercentage) / 100
  console.log("final result with risk:", result)

  if (!isFinite(result)) {
    console.log("result not finite, returning 0")
    return 0
  }

  return result
}

export function StatsCard({ stats }: StatsCardProps) {
  console.log("StatsCard props:", stats)

  const computedReturn = calculateReturn(
    stats.return.entry,
    stats.return.tp,
    stats.return.sl,
    stats.return.partialExit,
    stats.return.isLong,
    stats.return.breakEven,
    stats.return.exitType,
    stats.return.currentPrice,
    stats.return.riskPercentage,
  )

  const returnValue = isNaN(computedReturn) ? "0.00%" : `${computedReturn > 0 ? "+" : ""}${computedReturn.toFixed(2)}%`
  const returnProgress = isNaN(computedReturn) ? 0 : Math.min(Math.abs(computedReturn * 2), 100)

  console.log("computedReturn:", computedReturn, "returnValue:", returnValue, "returnProgress:", returnProgress)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Account Return</div>
              <div
                className={cn(
                  "text-sm font-medium",
                  computedReturn > 0 ? "text-green-500" : computedReturn < 0 ? "text-red-500" : "text-muted-foreground",
                )}
              >
                {returnValue}
              </div>
            </div>

            <Progress
              value={returnProgress}
              className={cn(
                "w-full h-1",
                computedReturn >= 0 ? "[&_[role='progressbar']]:bg-green-500" : "[&_[role='progressbar']]:bg-red-500",
              )}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Risk:Reward</div>
              <div className="text-sm font-medium">{stats.riskReward.ratio}</div>
            </div>
            <div className="grid grid-cols-5 gap-1 text-xs">
              {stats.riskReward.segments.map((_, i) => {
                const ratio = Number.parseFloat(stats.riskReward.ratio.split(":")[1] || "0")
                const clampedRatio = Math.min(Math.max(ratio, -1), 10)
                const shouldFill = i < Math.abs(clampedRatio)

                return (
                  <div
                    key={i}
                    className={cn(
                      "h-2 rounded transition-colors duration-300",
                      shouldFill ? (clampedRatio < 0 ? "bg-red-500" : "bg-green-500") : "bg-muted",
                    )}
                  />
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">MDD</div>
              <div className="text-sm font-medium text-red-500">{stats.maxDrawdown.value}</div>
            </div>
            <Progress value={stats.maxDrawdown.progress} className="w-full h-1 [&_[role='progressbar']]:bg-red-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.metrics.map((metric) => (
              <div key={metric.name} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full bg-${metric.color}-500`} />
                  <div className="text-sm font-medium text-muted-foreground">{metric.name}</div>
                </div>
                <div className="text-xl font-bold">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

