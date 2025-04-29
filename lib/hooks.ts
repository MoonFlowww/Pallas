import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useTradesData(type = 'REAL', page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/trades?type=${type}&page=${page}`,
    fetcher,
    { 
      revalidateOnFocus: false,
      dedupingInterval: 60000 // Cache for 1 minute
    }
  )
  
  return {
    trades: data?.trades || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 1,
    isLoading,
    isError: error,
    refresh: mutate
  }
}

export function useEquityCurveData(type = 'REAL', days = '180') {
  const { data, error, isLoading } = useSWR(
    `/api/equity-curve?type=${type}&days=${days}`,
    fetcher,
    { 
      revalidateOnFocus: false,
      dedupingInterval: 300000 // Cache for 5 minutes
    }
  )
  
  return {
    returnsData: data?.data || [],
    isLoading,
    isError: error
  }
}

// Add similar hooks for metrics and timeframes 