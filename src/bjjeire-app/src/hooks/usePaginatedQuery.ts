import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import type { HateoasPagination, PaginatedResponse } from '@/types/common'

interface PaginatedQueryParams<T, TParams extends { page?: number }> {
  queryKeyBase: string[]
  fetchFn: (
    params: TParams & { url?: string | null; page?: number }
  ) => Promise<PaginatedResponse<T>>
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
  refetch: () => Promise<UseQueryResult<PaginatedResponse<T>>>
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
  const [currentUrl, setCurrentUrl] = useState<string | null | undefined>(
    undefined
  )

  const { data, isLoading, isFetching, error, refetch } = useQuery<
    PaginatedResponse<T>
  >({
    queryKey: [
      ...queryKeyBase,
      { ...params, page: currentPage, url: currentUrl },
    ],
    queryFn: () =>
      fetchFn({ ...params, page: currentPage, url: currentUrl } as TParams & {
        url?: string | null
        page?: number
      }),
    placeholderData: previousData => previousData,
  })

  const handlePageChange = useCallback(
    (url: string | null, page?: number) => {
      setCurrentUrl(url)
      let newPage = currentPage
      if (page !== undefined) {
        newPage = page
      } else if (url) {
        const pageMatch = url.match(/[?&]page=(\d+)/)
        if (pageMatch) {
          newPage = parseInt(pageMatch[1], 10)
        }
      }
      setCurrentPage(newPage)
    },
    [currentPage]
  )

  const updateFilters = useCallback((newFilters: Partial<TParams>) => {
    setParams(prev => ({ ...prev, ...newFilters, page: 1 }))
    setCurrentPage(1)
    setCurrentUrl(undefined)
  }, [])

  const typedRefetch = useCallback(async () => {
    return refetch()
  }, [refetch])

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
    refetch: typedRefetch,
  }
}
