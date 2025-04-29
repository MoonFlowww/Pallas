import { useQuery } from '@tanstack/react-query'

async function fetchTrades(type, page) {
  const response = await fetch(`/api/trades?type=${type}&page=${page}`)
  if (!response.ok) throw new Error('Network response was not ok')
  return response.json()
}

export function useTradesData(type = 'REAL', page = 1) {
  return useQuery({
    queryKey: ['trades', type, page],
    queryFn: () => fetchTrades(type, page),
    select: (data) => ({
      trades: data.trades || [],
      totalCount: data.totalCount || 0,
      totalPages: data.totalPages || 1,
    })
  })
}

// Add similar functions for other API endpoints 