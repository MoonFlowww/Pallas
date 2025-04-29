"use client"

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

const assets = [
  { value: "forex", label: "Forex" },
  { value: "crypto", label: "Crypto" },
  { value: "stocks", label: "Stocks" },
  { value: "commodities", label: "Commodities" },
]

const generateActivityData = (assetType: string) => {
  return Array.from({ length: 3 }, () => ({
    type: Math.random() > 0.5 ? "buy" : "sell",
    asset: `${assetType.toUpperCase()}-${Math.floor(Math.random() * 100)}`,
    amount: Math.floor(Math.random() * 1000) + 500,
    price: Math.floor(Math.random() * 100) + 50,
    time: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toLocaleTimeString(),
  }))
}

export function TradingActivity() {
  const [selectedAsset, setSelectedAsset] = useState("forex")
  const activities = generateActivityData(selectedAsset)

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
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${
                  activity.type === "buy" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                }`}
              >
                {activity.type === "buy" ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
              </div>
              <div>
                <div className="font-medium">{activity.asset}</div>
                <div className="text-sm text-muted-foreground">{activity.time}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {activity.type === "buy" ? "+" : "-"}${activity.amount}
              </div>
              <div className="text-sm text-muted-foreground">${activity.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

