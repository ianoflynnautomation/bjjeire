import { useCallback, useEffect, useMemo } from 'react'
import type { QueryObserverResult } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { env } from '@/config/env'
import type { HateoasPagination, PaginatedResponse } from '@/types/common'
import { formatFetchError } from '@/utils/error-utils'
import { resolvePageTarget, usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import {
  readUrlFilters,
  readUrlPage,
  withUrlFilters,
  withUrlPage,
  type ListUrlFilter,
} from '@/utils/list-url-state'
import { scrollToTop } from '@/utils/scroll-utils'
import {
  useListPageSearch,
  type UseListPageSearchResult,
} from '@/hooks/useListPageSearch'

const DEFAULT_SEARCH_PAGE_SIZE = 100
const NO_URL_FILTERS: readonly never[] = []

interface PageableParams {
  page?: number
  pageSize?: number
}

interface UseListPageParams<T, TParams extends PageableParams> {
  queryKeyBase: string[]
  fetchFn: (params: TParams) => Promise<PaginatedResponse<T>>
  initialParams: TParams
  matchesSearch: (item: T, term: string) => boolean
  searchPageSize?: number
  urlFilters?: readonly ListUrlFilter<TParams>[]
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
  refetch: () => Promise<QueryObserverResult<PaginatedResponse<T>>>
  search: UseListPageSearchResult<T>
}

export function useListPage<T, TParams extends PageableParams>({
  queryKeyBase,
  fetchFn,
  initialParams,
  matchesSearch,
  searchPageSize = DEFAULT_SEARCH_PAGE_SIZE,
  urlFilters = NO_URL_FILTERS,
}: UseListPageParams<T, TParams>): UseListPageResult<T, TParams> {
  const search = useListPageSearch<T>(matchesSearch)
  const [searchParams, setSearchParams] = useSearchParams()

  // The URL owns the page and its filters, so reload, Back and shared links all work.
  const urlValues = useMemo(
    () => readUrlFilters(searchParams, urlFilters),
    [searchParams, urlFilters]
  )
  const page = search.isSearchActive ? 1 : readUrlPage(searchParams)
  const pageSize = search.isSearchActive ? searchPageSize : env.PAGE_SIZE

  const {
    data,
    pagination: paginationInfo,
    isLoading,
    isFetching,
    error: fetchError,
    params: activeFilters,
    currentPage,
    syncState,
    refetch,
  } = usePaginatedQuery<T, TParams>({
    queryKeyBase,
    fetchFn,
    initialParams: { ...initialParams, ...urlValues, page, pageSize },
  })

  useEffect(() => {
    syncState({ ...urlValues, pageSize }, page)
  }, [urlValues, pageSize, page, syncState])

  // A stale link can point past the last page; show the last real page instead.
  useEffect(() => {
    if (
      paginationInfo &&
      !isFetching &&
      page > 1 &&
      paginationInfo.currentPage === page &&
      page > paginationInfo.totalPages
    ) {
      setSearchParams(withUrlPage(searchParams, paginationInfo.totalPages), {
        replace: true,
      })
    }
  }, [paginationInfo, isFetching, page, searchParams, setSearchParams])

  const items = useMemo(() => data ?? [], [data])
  const filteredItems = useMemo(
    () => search.filterItems(items),
    [search, items]
  )

  const pushUrl = useCallback(
    (next: URLSearchParams) => {
      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next)
      }
    },
    [searchParams, setSearchParams]
  )

  const updateFilters = useCallback(
    (newFilters: Partial<TParams>) => {
      pushUrl(withUrlFilters(searchParams, newFilters, urlFilters))
    },
    [pushUrl, searchParams, urlFilters]
  )

  const onPageChange = useCallback(
    (url: string | null, targetPage?: number) => {
      pushUrl(withUrlPage(searchParams, resolvePageTarget(url, targetPage)))
      scrollToTop()
    },
    [pushUrl, searchParams]
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
    formattedErrorMessage: formatFetchError(fetchError),
    updateFilters,
    onPageChange,
    refetch,
    search,
  }
}
