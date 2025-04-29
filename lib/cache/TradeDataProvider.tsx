"use client"

import React, { createContext, useContext, useCallback } from 'react'
import useSWR, { SWRConfig } from 'swr'
import { toast } from 'sonner'

// Define types
interface ApiError extends Error {
  info?: any;
  status?: number;
}

interface Trade {
  id: number
  type: string
  date: string
  asset: string
  biais: string
  entry_price: number
  exit_price: number | null
  rr: number | null
  r: number | null
  hedge: number | null
  risk: number | null
  state: string | null
  result: number | null
  mdd: number | null
  calmar: number | null
  upi: number | null
  screenshot: string | null
  live: boolean | null
}

interface ReturnsData {
  trade_date: string
  daily_return: number
  trade_count: number
  cumulative_return: number
  benchmark_return: number
  benchmark_cumulative_return: number
  avg_daily_return: number
  daily_return_stddev: number
  max_drawdown: number
  winning_days: number
  losing_days: number
}

interface Metrics {
  totalTrades: number
  tradingDays: number
  winRate: number
  winRateTP: number
  totalReturn: number
  avgReturnPerTrade: number
  avgDailyReturn: number
  maxDrawdown: number
  avgDrawdown: number
  mad: number
  madDownside: number
  recoveryMDD: number
  recoveryDD: number
  recovery: number
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  cagr: number
  omegaRatio: number
  rachevRatio: number
  kellyCriterion: number
  upi: number
  alpha: number
  beta: number
  correlation: number
  avgRisk: number
  avgHedge: number
  avgPositiveHedge: number
  winning_days: number
  losing_days: number
  var95: number
  cVaR95: number
  skew: number
  kurtosis: number
  kurtosisPositive: number
  kurtosisNegative: number
  kurtosisRatio: number
  cornishFisher: number
}

interface TimeframeData {
  daily: any[]
  weekly: any[]
  monthly: any[]
  quarterly: any[]
  annually: any[]
}

// Store for API results
interface TradeDataStore {
  // Trades cache
  trades: {
    [key: string]: {
      trades: Trade[]
      totalCount: number
      totalPages: number
    }
  }
  // Equity curves cache
  equityCurves: {
    [key: string]: ReturnsData[]
  }
  // Metrics cache
  metrics: {
    [key: string]: Metrics
  }
  // Timeframes cache
  timeframes: {
    [key: string]: TimeframeData
  }
}

// API fetcher with error handling
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`) as ApiError
    error.info = await response.json().catch(() => ({}))
    error.status = response.status
    throw error
  }
  
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || "API returned unsuccessful response")
  }
  
  return data
}

// Cache keys creator
const createCacheKey = (endpoint: string, params: Record<string, any>) => {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) queryParams.append(key, String(value))
  })
  return `${endpoint}?${queryParams.toString()}`
}

// Context for trade data
interface TradeDataContextType {
  // Trade data hooks
  useTradesData: (type: "REAL" | "PAPER" | "ALL", page?: number) => {
    data: { trades: Trade[], totalCount: number, totalPages: number }
    isLoading: boolean
    error: any
    mutate: () => void
  }
  useEquityCurveData: (type: "REAL" | "PAPER" | "ALL", days?: string) => {
    data: ReturnsData[]
    isLoading: boolean
    error: any
    mutate: () => void
  }
  useMetricsData: (type: "REAL" | "PAPER" | "ALL", days?: string) => {
    data: Metrics | null
    isLoading: boolean
    error: any
    mutate: () => void
  }
  useTimeframeData: (type: "REAL" | "PAPER" | "ALL") => {
    data: TimeframeData | null
    isLoading: boolean
    error: any
    mutate: () => void
  }
  // Cache operations
  clearCache: () => void
  refreshAllData: (type: "REAL" | "PAPER" | "ALL") => Promise<void>
}

const TradeDataContext = createContext<TradeDataContextType | null>(null)

// Provider component
export function TradeDataProvider({ children }: { children: React.ReactNode }) {
  
  // Hook for trades data with caching
  const useTradesData = (type: "REAL" | "PAPER" | "ALL", page = 1) => {
    const cacheKey = createCacheKey('/api/trades', { type, page })
    
    const { data, error, isLoading, mutate } = useSWR(cacheKey, fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
      errorRetryCount: 2,
      onError: (err) => {
        toast.error("Failed to load trades", {
          description: err.message || "Unknown error occurred"
        })
      }
    })
    
    return {
      data: {
        trades: data?.trades || [],
        totalCount: data?.totalCount || 0,
        totalPages: data?.totalPages || 1
      },
      isLoading,
      error,
      mutate
    }
  }
  
  // Hook for equity curve data with caching
  const useEquityCurveData = (type: "REAL" | "PAPER" | "ALL", days = '180') => {
    const cacheKey = createCacheKey('/api/equity-curve', { type, days })
    
    const { data, error, isLoading, mutate } = useSWR(cacheKey, fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache for 5 minutes
      errorRetryCount: 2,
      onError: (err) => {
        toast.error("Failed to load equity curve data", {
          description: err.message || "Unknown error occurred"
        })
      }
    })
    
    return {
      data: data?.data || [],
      isLoading,
      error,
      mutate
    }
  }
  
  // Hook for metrics data with caching
  const useMetricsData = (type: "REAL" | "PAPER" | "ALL", days = '180') => {
    const cacheKey = createCacheKey('/api/metrics', { type, days })
    
    const { data, error, isLoading, mutate } = useSWR(cacheKey, fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache for 5 minutes
      errorRetryCount: 2,
      onError: (err) => {
        toast.error("Failed to load metrics data", {
          description: err.message || "Unknown error occurred"
        })
      }
    })
    
    return {
      data: data?.metrics || null,
      isLoading,
      error,
      mutate
    }
  }
  
  // Hook for timeframe data with caching
  const useTimeframeData = (type: "REAL" | "PAPER" | "ALL") => {
    const cacheKey = createCacheKey('/api/timeframes', { type })
    
    const { data, error, isLoading, mutate } = useSWR(cacheKey, fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 600000, // Cache for 10 minutes
      errorRetryCount: 2,
      onError: (err) => {
        toast.error("Failed to load timeframe data", {
          description: err.message || "Unknown error occurred"
        })
      }
    })
    
    return {
      data: data?.timeframes || null,
      isLoading,
      error,
      mutate
    }
  }
  
  // Clear all cache
  const clearCache = useCallback(() => {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('swr$')) {
        localStorage.removeItem(key)
      }
    })
    window.location.reload()
  }, [])
  
  // Refresh all data for a specific type
  const refreshAllData = useCallback(async (type: "REAL" | "PAPER" | "ALL") => {
    // Get all cache keys for this type
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith('swr$') && key.includes(`type=${type}`))
    
    // Clear these specific keys
    keys.forEach(key => localStorage.removeItem(key))
    
    // Show a toast
    toast.info("Refreshing all data...", {
      duration: 2000
    })
    
    // Force reload
    window.location.reload()
  }, [])

  // Provide the context
  return (
    <SWRConfig 
      value={{
        provider: () => new Map(),
        shouldRetryOnError: false
      }}
    >
      <TradeDataContext.Provider
        value={{
          useTradesData,
          useEquityCurveData,
          useMetricsData,
          useTimeframeData,
          clearCache,
          refreshAllData
        }}
      >
        {children}
      </TradeDataContext.Provider>
    </SWRConfig>
  )
}

// Hook to use the trade data context
export function useTradeData() {
  const context = useContext(TradeDataContext)
  if (!context) {
    throw new Error('useTradeData must be used within a TradeDataProvider')
  }
  return context
} 