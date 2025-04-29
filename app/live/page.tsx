"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { TradingSessions } from "@/components/trading-sessions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { CrossAxisChart } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { cn } from "@/utils/cn"

interface AssetData {
  name: string
  priceChange: number
  volumeChange: number
  color: string
}

export default function LivePage() {
  const [assets, setAssets] = useState<AssetData[]>([
    { name: "EUR/USD", priceChange: 0.75, volumeChange: 0.45, color: "bg-blue-500" },
    { name: "DXY", priceChange: -0.25, volumeChange: 0.3, color: "bg-green-500" },
    { name: "VIX", priceChange: 0.15, volumeChange: -0.6, color: "bg-yellow-500" },
    { name: "GOLD", priceChange: 0.5, volumeChange: 0.8, color: "bg-purple-500" },
  ])

  const [activeAssets, setActiveAssets] = useState<boolean[]>(Array(assets.length).fill(true))

  const handleNameChange = (index: number, newName: string) => {
    setAssets((prev) => prev.map((asset, i) => (i === index ? { ...asset, name: newName } : asset)))
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
          <Card>
            <CardHeader>
              <CardTitle>Live Data</CardTitle>
              <CardDescription>Real-time market visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[2fr,1.5fr,2fr] gap-6">
                <div>
                  <div className="relative h-[400px] rounded-lg border p-8 overflow-hidden">
                    <div className="absolute -left-4 top-1/2 -rotate-90 transform text-sm font-medium text-muted-foreground">
                      Price
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground">
                      Volume
                    </div>
                    <CrossAxisChart className="h-full" />
                  </div>
                </div>
                <div className="space-y-6">
                  {assets.map((asset, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAssets((prev) => prev.map((active, i) => (i === index ? !active : active)))
                          }}
                          className={cn(
                            "h-3 w-3 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            activeAssets[index] ? asset.color : "bg-muted hover:bg-muted/80",
                          )}
                          aria-label={`Toggle ${asset.name} visibility`}
                        />
                        <div className="flex-1">
                          <Input
                            value={asset.name}
                            onChange={(e) => handleNameChange(index, e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pl-6">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Price</span>
                            <span
                              className={cn("font-medium", asset.priceChange > 0 ? "text-green-500" : "text-red-500")}
                            >
                              {asset.priceChange > 0 ? "+" : ""}
                              {asset.priceChange}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                asset.priceChange > 0 ? "bg-green-500" : "bg-red-500",
                              )}
                              style={{
                                width: `${Math.abs(asset.priceChange) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Volume</span>
                            <span
                              className={cn("font-medium", asset.volumeChange > 0 ? "text-green-500" : "text-red-500")}
                            >
                              {asset.volumeChange > 0 ? "+" : ""}
                              {asset.volumeChange}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                asset.volumeChange > 0 ? "bg-green-500" : "bg-red-500",
                              )}
                              style={{
                                width: `${Math.abs(asset.volumeChange) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 font-semibold">Market Stats</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Correlation</span>
                          <span>0.85</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 w-[85%] rounded-full bg-blue-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Volatility</span>
                          <span>0.45</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 w-[45%] rounded-full bg-yellow-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 font-semibold">Volume Stats</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Strength</span>
                          <span>0.92</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 w-[92%] rounded-full bg-green-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Volume Ratio</span>
                          <span>0.67</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 w-[67%] rounded-full bg-purple-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">OBI</span>
                          <span>0.82</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 w-[82%] rounded-full bg-blue-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Depth</span>
                          <span>0.54</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 w-[54%] rounded-full bg-indigo-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rise Ratio</span>
                          <span>0.73</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 w-[73%] rounded-full bg-violet-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

