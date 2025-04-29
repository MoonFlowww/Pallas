"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import { toast } from 'sonner'

// Define types for your cache
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface DataCache {
  [key: string]: CacheEntry<any>
}

interface DataCacheContextType {
  fetchTrades: (type: string, page: number) => Promise<any>
  fetchEquityCurve: (type: string, days: string) => Promise<any>
  fetchMetrics: (type: string, days: string) => Promise<any>
  fetchTimeframes: (type: string) => Promise<any>
  clearCache: () => void
}

const DataCacheContext = createContext<DataCacheContextType | null>(null)

export function DataCacheProvider({ children }) {
  const [cache, setCache] = useState<DataCache>({})
  
  const getCachedData = useCallback((key: string) => {
    const entry = cache[key]
    if (!entry) return null
    if (Date.now() > entry.expiresAt) return null
    return entry.data
  }, [cache])
  
  const setCachedData = useCallback((key: string, data: any, ttlMinutes = 5) => {
    const now = Date.now()
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: now,
        expiresAt: now + (ttlMinutes * 60 * 1000)
      }
    }))
  }, [])
  
  const fetchWithCache = useCallback(async (url: string, ttlMinutes = 5) => {
    try {
      // Check cache first
      const cachedData = getCachedData(url)
      if (cachedData) return cachedData
      
      // If not cached or expired, fetch fresh data
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "API returned an error")
      
      // Cache the result
      setCachedData(url, result, ttlMinutes)
      return result
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      toast.error(`Failed to load data`, {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      })
      throw error
    }
  }, [getCachedData, setCachedData])
  
  const fetchTrades = useCallback((type = 'REAL', page = 1) => {
    return fetchWithCache(`/api/trades?type=${type}&page=${page}`, 2) // Cache for 2 minutes
  }, [fetchWithCache])
  
  const fetchEquityCurve = useCallback((type = 'REAL', days = '180') => {
    return fetchWithCache(`/api/equity-curve?type=${type}&days=${days}`, 5) // Cache for 5 minutes
  }, [fetchWithCache])
  
  const fetchMetrics = useCallback((type = 'REAL', days = '180') => {
    return fetchWithCache(`/api/metrics?type=${type}&days=${days}`, 5) // Cache for 5 minutes
  }, [fetchWithCache])
  
  const fetchTimeframes = useCallback((type = 'REAL') => {
    return fetchWithCache(`/api/timeframes?type=${type}`, 10) // Cache for 10 minutes
  }, [fetchWithCache])
  
  const clearCache = useCallback(() => {
    setCache({})
  }, [])
  
  return (
    <DataCacheContext.Provider 
      value={{ 
        fetchTrades, 
        fetchEquityCurve, 
        fetchMetrics, 
        fetchTimeframes, 
        clearCache 
      }}
    >
      {children}
    </DataCacheContext.Provider>
  )
}

export function useDataCache() {
  const context = useContext(DataCacheContext)
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider')
  }
  return context
} 