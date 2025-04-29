"use client"

import { useEffect, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

const pairs = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "USD/CAD", "AUD/USD"]

interface RateChange {
  pair: string
  change: number
  price: number
}

export function CrossRateChange() {
  const [rates, setRates] = useState<RateChange[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Generate initial data
    setRates(
      pairs.map((pair) => ({
        pair,
        change: (Math.random() * 2 - 1) * 0.5, // Random change between -0.5% and 0.5%
        price: 1 + Math.random() * 0.5, // Random price between 1 and 1.5
      })),
    )

    // Update one random pair every 2 seconds
    const interval = setInterval(() => {
      setRates((prev) => {
        const newRates = [...prev]
        const randomIndex = Math.floor(Math.random() * pairs.length)
        const oldChange = newRates[randomIndex].change
        newRates[randomIndex] = {
          ...newRates[randomIndex],
          change: oldChange + (Math.random() * 0.2 - 0.1), // Small random adjustment
          price: newRates[randomIndex].price * (1 + (Math.random() * 0.002 - 0.001)), // Small price adjustment
        }
        return newRates
      })
    }, 2000)

    // Rotate through pairs every 3 seconds
    const tickerInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % pairs.length)
    }, 3000)

    return () => {
      clearInterval(interval)
      clearInterval(tickerInterval)
    }
  }, [])

  if (rates.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Ticker */}
      <div className="flex h-12 items-center justify-between rounded-lg border bg-muted/50 px-4">
        <div className="font-mono text-lg">{rates[currentIndex].pair}</div>
        <div className="flex items-center gap-2">
          <div className="text-lg font-mono">{rates[currentIndex].price.toFixed(4)}</div>
          <div className={`flex items-center ${rates[currentIndex].change >= 0 ? "text-green-500" : "text-red-500"}`}>
            {rates[currentIndex].change >= 0 ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
            <span className="font-mono">{Math.abs(rates[currentIndex].change).toFixed(2)}%</span>
          </div>
        </div>
      </div>
      {/* Rate Grid */}
      <div className="grid grid-cols-2 gap-2">
        {rates.map((rate) => (
          <div key={rate.pair} className="flex items-center justify-between rounded-lg border p-2">
            <div className="font-mono text-sm">{rate.pair}</div>
            <div className={`flex items-center gap-1 ${rate.change >= 0 ? "text-green-500" : "text-red-500"}`}>
              {rate.change >= 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
              <span className="font-mono text-sm">{Math.abs(rate.change).toFixed(2)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

