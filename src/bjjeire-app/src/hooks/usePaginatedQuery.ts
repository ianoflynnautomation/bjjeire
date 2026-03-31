import { useQuery, type QueryObserverResult } from '@tanstack/react-query'
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
  refetch: () => Promise<QueryObserverResult<PaginatedResponse<T>, Error>>
}

interface QueryState<TParams> {
  params: TParams
  currentPage: number
}

type QueryAction<TParams> =
  | { type: 'SET_PAGE'; page: number }
  | { type: 'UPDATE_FILTERS'; filters: Partial<TParams> }

function queryReducer<TParams extends { page?: number }>(
  state: QueryState<TParams>,
  action: QueryAction<TParams>
): QueryState<TParams> {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.page }
    case 'UPDATE_FILTERS':
      return {
        params: { ...state.params, ...action.filters },
        currentPage: 1,
      }
  }
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
    placeholderData: previousData => previousData,
  })

  const handlePageChange = useCallback((url: string | null, page?: number) => {
    if (page !== undefined) {
      dispatch({ type: 'SET_PAGE', page })
      return
    }
    if (url) {
      try {
        const pageParam = new URL(url).searchParams.get('page')
        if (pageParam) {
          dispatch({ type: 'SET_PAGE', page: Number.parseInt(pageParam, 10) })
          return
        }
      } catch (err) {
        logger.warn(
          'usePaginatedQuery: malformed pagination URL, defaulting to page 1',
          err
        )
      }
    }
    dispatch({ type: 'SET_PAGE', page: 1 })
  }, [])

  const updateFilters = useCallback((newFilters: Partial<TParams>) => {
    dispatch({ type: 'UPDATE_FILTERS', filters: newFilters })
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
