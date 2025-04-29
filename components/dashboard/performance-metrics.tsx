"use client"

import { Line, LineChart, ResponsiveContainer } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

const assets = [
  { value: "forex", label: "Forex" },
  { value: "crypto", label: "Crypto" },
  { value: "stocks", label: "Stocks" },
  { value: "commodities", label: "Commodities" },
]

const generateCorrelationData = (assetType: string) => {
  const volatility = assetType === "crypto" ? 0.2 : 0.1
  const trend = assetType === "stocks" ? 0.6 : 0.3

  return Array.from({ length: 20 }, (_, i) => ({
    value: Math.sin(i * 0.5) * volatility + trend + Math.random() * volatility,
  }))
}

export function PerformanceMetrics() {
  const [selectedAsset, setSelectedAsset] = useState("forex")
  const data = generateCorrelationData(selectedAsset)

  return (
    <div className="space-y-4">
      <Select value={selectedAsset} onValueChange={setSelectedAsset}>
        <SelectTrigger>
          <SelectValue placeholder="Select asset type" />
        </SelectTrigger>
        <SelectContent>
          {assets.map((asset) => (
            <SelectItem key={asset.value} value={asset.value}>
              {asset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="aspect-[4/3]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              strokeWidth={2}
              dot={false}
              className={`${
                selectedAsset === "crypto"
                  ? "stroke-orange-500"
                  : selectedAsset === "stocks"
                    ? "stroke-green-500"
                    : "stroke-primary"
              }`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

