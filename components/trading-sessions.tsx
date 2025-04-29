"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { NetworkStatus } from "./network-status"
import { cn } from "@/lib/utils"

interface TradingSession {
  name: string
  timezone: string
  preMarketStart: number // Hour in 24h format
  marketOpen: number
  marketClose: number
}

const sessions: TradingSession[] = [
  {
    name: "Tokyo",
    timezone: "Asia/Tokyo",
    preMarketStart: 7,
    marketOpen: 9,
    marketClose: 15,
  },
  {
    name: "London",
    timezone: "Europe/London",
    preMarketStart: 7,
    marketOpen: 8,
    marketClose: 16,
  },
  {
    name: "New York",
    timezone: "America/New_York",
    preMarketStart: 7,
    marketOpen: 9,
    marketClose: 16,
  },
  {
    name: "Sydney",
    timezone: "Australia/Sydney",
    preMarketStart: 7,
    marketOpen: 8,
    marketClose: 16,
  },
]

function getSessionStatus(session: TradingSession, hour: number) {
  if (hour >= session.marketOpen && hour < session.marketClose) {
    return "open"
  } else if (hour >= session.preMarketStart && hour < session.marketOpen) {
    return "pre-open"
  } else {
    return "closed"
  }
}

function StatusIndicator({ status }: { status: "open" | "pre-open" | "closed" }) {
  return (
    <div
      className={cn(
        "size-2 rounded-full",
        status === "open" && "bg-green-500",
        status === "pre-open" && "bg-orange-500",
        status === "closed" && "bg-gray-300",
      )}
    />
  )
}

export function TradingSessions() {
  const [times, setTimes] = React.useState<{ [key: string]: { time: string; status: "open" | "pre-open" | "closed" } }>(
    {},
  )

  React.useEffect(() => {
    function updateTimes() {
      const newTimes: { [key: string]: { time: string; status: "open" | "pre-open" | "closed" } } = {}

      sessions.forEach((session) => {
        const time = new Date().toLocaleTimeString("en-US", {
          timeZone: session.timezone,
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })

        const hour = Number.parseInt(time.split(":")[0])
        const status = getSessionStatus(session, hour)

        newTimes[session.name] = { time, status }
      })

      setTimes(newTimes)
    }

    updateTimes()
    const interval = setInterval(updateTimes, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-6">
      {sessions.map((session) => (
        <div key={session.name} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-sm">
          <StatusIndicator status={times[session.name]?.status || "closed"} />
          <div className="flex items-center gap-1.5">
            <Clock className="size-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs font-medium leading-none">{session.name}</span>
              <span className="text-xs text-muted-foreground">{times[session.name]?.time || "--:--"}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="border-l pl-6">
        <NetworkStatus />
      </div>
    </div>
  )
}

