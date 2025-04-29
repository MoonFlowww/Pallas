"use client"

import { Bar, BarChart, ResponsiveContainer } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

const assets = [
  { value: "forex", label: "Forex" },
  { value: "crypto", label: "Crypto" },
  { value: "stocks", label: "Stocks" },
  { value: "commodities", label: "Commodities" },
]

const generateChangeData = (assetType: string) => {
  // Generate random data based on asset type
  return Array.from({ length: 10 }, (_, i) => ({
    value: Math.random() * (assetType === "crypto" ? 15 : 5) - (assetType === "crypto" ? 7.5 : 2.5),
    name: `Asset ${i + 1}`,
  }))
}

export function MarketOverview() {
  const [selectedAsset, setSelectedAsset] = useState("forex")
  const data = generateChangeData(selectedAsset)

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
          <BarChart data={data}>
            <Bar
              dataKey="value"
              fill="currentColor"
              className="fill-primary"
              radius={[4, 4, 0, 0]}
              className={`${
                selectedAsset === "crypto"
                  ? "[&_.recharts-bar-rectangle]:fill-orange-500"
                  : "[&_.recharts-bar-rectangle]:fill-primary"
              }`}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

