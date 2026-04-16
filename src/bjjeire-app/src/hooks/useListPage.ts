import { useCallback, useEffect, useMemo } from 'react'
import type { QueryObserverResult } from '@tanstack/react-query'
import { env } from '@/config/env'
import type { HateoasPagination, PaginatedResponse } from '@/types/common'
import { formatFetchError } from '@/utils/error-utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import {
  useListPageSearch,
  type UseListPageSearchResult,
} from '@/hooks/useListPageSearch'

const DEFAULT_SEARCH_PAGE_SIZE = 200

interface UseListPageParams<T, TParams extends { page?: number }> {
  queryKeyBase: string[]
  fetchFn: (params: TParams) => Promise<PaginatedResponse<T>>
  initialParams: TParams
  matchesSearch: (item: T, term: string) => boolean
  searchPageSize?: number
}

export interface UseListPageResult<T, TParams> {
  items: T[]
  filteredItems: T[]
  paginationInfo: HateoasPagination | undefined
  isLoading: boolean
  isFetching: boolean
  isInitialLoading: boolean
  activeFilters: TParams
  currentPage: number
  fetchError: Error | null
  formattedErrorMessage: string
  updateFilters: (newFilters: Partial<TParams>) => void
  onPageChange: (url: string | null, page?: number) => void
  refetch: () => Promise<QueryObserverResult<PaginatedResponse<T>, Error>>
  search: UseListPageSearchResult<T>
}

export function useListPage<T, TParams extends { page?: number }>({
  queryKeyBase,
  fetchFn,
  initialParams,
  matchesSearch,
  searchPageSize = DEFAULT_SEARCH_PAGE_SIZE,
}: UseListPageParams<T, TParams>): UseListPageResult<T, TParams> {
  const scrollToTop = useScrollToTop()
  const search = useListPageSearch<T>(matchesSearch)

  const {
    data,
    pagination: paginationInfo,
    isLoading,
    isFetching,
    error: fetchError,
    params: activeFilters,
    currentPage,
    handlePageChange: rawHandlePageChange,
    updateFilters,
    refetch,
  } = usePaginatedQuery<T, TParams>({
    queryKeyBase,
    fetchFn,
    initialParams,
  })

  useEffect(() => {
    updateFilters({
      page: 1,
      pageSize: search.isSearchActive ? searchPageSize : env.PAGE_SIZE,
    } as unknown as Partial<TParams>)
  }, [search.isSearchActive, searchPageSize, updateFilters])

  const items = useMemo(() => data ?? [], [data])
  const filteredItems = useMemo(
    () => search.filterItems(items),
    [search, items]
  )

  const onPageChange = useCallback(
    (url: string | null, page?: number) => {
      rawHandlePageChange(url, page)
      scrollToTop()
    },
    [rawHandlePageChange, scrollToTop]
  )

  return {
    items,
    filteredItems,
    paginationInfo,
    isLoading,
    isFetching,
    isInitialLoading: isLoading && items.length === 0,
    activeFilters,
    currentPage,
    fetchError,
    formattedErrorMessage: formatFetchError(fetchError) ?? '',
    updateFilters,
    onPageChange,
    refetch,
    search,
  }
}
