"use client"

import * as React from "react"
import { Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function NetworkStatus() {
  const [dbStatus, setDbStatus] = React.useState<{
    isConnected: boolean
    error?: string
    lastChecked?: Date
    message?: string
  }>({ isConnected: false })

  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/health-check")
        const data = await response.json()

        setDbStatus({
          isConnected: data.success,
          lastChecked: new Date(),
          error: data.error,
          message: data.message,
        })
      } catch (error) {
        console.error("Connection check failed:", error)
        setDbStatus({
          isConnected: false,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : "Failed to connect to Pallas_PostgreSQL_Local database",
        })
      }
    }

    // Check immediately
    checkConnection()

    // Then check every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            dbStatus.isConnected ? "text-green-500 hover:text-green-600" : "text-red-500 hover:text-red-600",
          )}
        >
          <Database className="h-4 w-4" />
          <span className="sr-only">Database connection status</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Database Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          <div className="mb-2 flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", dbStatus.isConnected ? "bg-green-500" : "bg-red-500")} />
            <span className="text-sm">
              {dbStatus.isConnected ? "Connected to PostgreSQL" : "Database Disconnected"}
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Status: <span className="font-medium">{dbStatus.isConnected ? "Connected" : "Disconnected"}</span>
            </div>
            {dbStatus.lastChecked && (
              <div className="text-xs text-muted-foreground">
                Last checked: <span className="font-medium">{dbStatus.lastChecked.toLocaleTimeString()}</span>
              </div>
            )}
            {dbStatus.error && <div className="text-xs text-red-500">Error: {dbStatus.error}</div>}
            {dbStatus.message && (
              <div className="text-xs text-muted-foreground">
                Message: <span className="font-medium">{dbStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

