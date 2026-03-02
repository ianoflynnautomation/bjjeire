import { useQuery, type QueryObserverResult } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import type { HateoasPagination, PaginatedResponse } from '@/types/common'

interface PaginatedQueryParams<T, TParams extends { page?: number }> {
  queryKeyBase: string[]
  fetchFn: (params: TParams & { page?: number }) => Promise<PaginatedResponse<T>>
  initialParams: TParams
}

interface PaginatedQueryResult<T, TParams> {
  data: T[] | undefined
  pagination: HateoasPagination | undefined
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  currentPage: number
  params: TParams
  handlePageChange: (url: string | null, page?: number) => void
  updateFilters: (newFilters: Partial<TParams>) => void
  refetch: () => Promise<QueryObserverResult<PaginatedResponse<T>, Error>>
}

export const usePaginatedQuery = <T, TParams extends { page?: number }>({
  queryKeyBase,
  fetchFn,
  initialParams,
}: PaginatedQueryParams<T, TParams>): PaginatedQueryResult<T, TParams> => {
  const [params, setParams] = useState<TParams>(initialParams)
  const [currentPage, setCurrentPage] = useState<number>(
    initialParams.page ?? 1
  )

  const { data, isLoading, isFetching, error, refetch } = useQuery<
    PaginatedResponse<T>
  >({
    queryKey: [...queryKeyBase, { ...params, page: currentPage }],
    queryFn: () => fetchFn({ ...params, page: currentPage }),
    placeholderData: previousData => previousData,
  })

  const handlePageChange = useCallback(
    (url: string | null, page?: number) => {
      let newPage = page
      if (page !== undefined) {
        setCurrentPage(page)
        return
      } else if (url) {
        const pageMatch = url.match(/[?&]page=(\d+)/)
        if (pageMatch) {
          newPage = parseInt(pageMatch[1], 10)
        }
      }
      setCurrentPage(newPage ?? 1)
    },
    []
  )

  const updateFilters = useCallback((newFilters: Partial<TParams>) => {
    setParams(prev => ({ ...prev, ...newFilters, page: 1 }))
    setCurrentPage(1)
  }, [])

  return {
    data: data?.data,
    pagination: data?.pagination,
    isLoading,
    isFetching,
    error,
    params,
    currentPage,
    handlePageChange,
    updateFilters,
    refetch,
  }
}
