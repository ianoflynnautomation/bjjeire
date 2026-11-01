import {
  keepPreviousData,
  useQuery,
  type QueryObserverResult,
} from '@tanstack/react-query'
import { useReducer, useCallback } from 'react'
import type { HateoasPagination, PaginatedResponse } from '@/types/common'
import { logger } from '@/lib/logger'

interface PaginatedQueryParams<T, TParams extends { page?: number }> {
  queryKeyBase: string[]
  fetchFn: (
    params: TParams & { page?: number }
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
  syncState: (filters: Partial<TParams>, page: number) => void
  refetch: () => Promise<QueryObserverResult<PaginatedResponse<T>>>
}

interface QueryState<TParams> {
  params: TParams
  currentPage: number
}

type QueryAction<TParams> =
  | { type: 'SET_PAGE'; page: number }
  | { type: 'UPDATE_FILTERS'; filters: Partial<TParams> }
  | { type: 'SYNC'; filters: Partial<TParams>; page: number }

function queryReducer<TParams extends { page?: number }>(
  state: QueryState<TParams>,
  action: QueryAction<TParams>
): QueryState<TParams> {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.page }
    case 'UPDATE_FILTERS':
      return {
        params: { ...state.params, ...action.filters, page: 1 },
        currentPage: 1,
      }
    case 'SYNC':
      return {
        params: { ...state.params, ...action.filters, page: action.page },
        currentPage: action.page,
      }
  }
}

export function resolvePageTarget(url: string | null, page?: number): number {
  if (page !== undefined) {
    return page
  }
  if (url) {
    try {
      const pageParam = new URL(url).searchParams.get('page')
      if (pageParam) {
        return Number.parseInt(pageParam, 10)
      }
    } catch (err) {
      logger.warn(
        'usePaginatedQuery: malformed pagination URL, defaulting to page 1',
        err
      )
    }
  }
  return 1
}

export function usePaginatedQuery<T, TParams extends { page?: number }>({
  queryKeyBase,
  fetchFn,
  initialParams,
}: PaginatedQueryParams<T, TParams>): PaginatedQueryResult<T, TParams> {
  const [{ params, currentPage }, dispatch] = useReducer(
    queryReducer<TParams>,
    {
      params: initialParams,
      currentPage: initialParams.page ?? 1,
    }
  )

  const { data, isLoading, isFetching, error, refetch } = useQuery<
    PaginatedResponse<T>
  >({
    queryKey: [...queryKeyBase, { ...params, page: currentPage }],
    queryFn: () => fetchFn({ ...params, page: currentPage }),
    placeholderData: keepPreviousData,
  })

  const handlePageChange = useCallback((url: string | null, page?: number) => {
    dispatch({ type: 'SET_PAGE', page: resolvePageTarget(url, page) })
  }, [])

  const updateFilters = useCallback((newFilters: Partial<TParams>) => {
    dispatch({ type: 'UPDATE_FILTERS', filters: newFilters })
  }, [])

  const syncState = useCallback((filters: Partial<TParams>, page: number) => {
    dispatch({ type: 'SYNC', filters, page })
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
    syncState,
    refetch,
  }
}
