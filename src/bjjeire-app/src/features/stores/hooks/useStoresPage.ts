import { useCallback, useEffect, useMemo } from 'react'
import { env } from '@/config/env'
import type { StoreDto, GetStorePaginationQuery } from '@/types/stores'
import { formatFetchError } from '@/utils/error-utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { getStores } from '@/features/stores/api/get-stores'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import type { HateoasPagination, PaginatedResponse } from '@/types/common'
import type { QueryObserverResult } from '@tanstack/react-query'
import { useStoreSearch } from './useStoresSearch'
import type { UseStoreSearchResult } from './useStoresSearch'

const SEARCH_PAGE_SIZE = 200

const initialStoreFilters: GetStorePaginationQuery = {
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

interface UseStoresPageResult {
  stores: StoreDto[]
  filteredStores: StoreDto[]
  paginationInfo: HateoasPagination | undefined
  isLoading: boolean
  isFetching: boolean
  currentPage: number
  formattedErrorMessage: string
  isInitialLoading: boolean
  fetchError: Error | null
  onPageChange: (url: string | null, page?: number) => void
  refetch: () => Promise<
    QueryObserverResult<PaginatedResponse<StoreDto>, Error>
  >
  search: UseStoreSearchResult
}

export function useStoresPage(): UseStoresPageResult {
  const scrollToTop = useScrollToTop()
  const storeSearch = useStoreSearch()

  const {
    data: paginatedData,
    pagination: paginationInfo,
    isLoading,
    isFetching,
    error: fetchError,
    currentPage,
    handlePageChange: rawHandlePageChange,
    updateFilters,
    refetch,
  } = usePaginatedQuery<StoreDto, GetStorePaginationQuery>({
    queryKeyBase: ['stores'],
    fetchFn: getStores,
    initialParams: initialStoreFilters,
  })

  useEffect(() => {
    updateFilters({
      page: 1,
      pageSize: storeSearch.isSearchActive ? SEARCH_PAGE_SIZE : env.PAGE_SIZE,
    } as Partial<GetStorePaginationQuery>)
  }, [storeSearch.isSearchActive, updateFilters])

  const stores = useMemo(() => paginatedData ?? [], [paginatedData])

  const filteredStores = useMemo(
    () => storeSearch.filterStores(stores),
    [storeSearch, stores]
  )

  const onPageChange = useCallback(
    (url: string | null, page?: number) => {
      rawHandlePageChange(url, page)
      scrollToTop()
    },
    [rawHandlePageChange, scrollToTop]
  )

  return {
    stores,
    filteredStores,
    paginationInfo,
    isLoading,
    isFetching,
    currentPage,
    formattedErrorMessage: formatFetchError(fetchError) ?? '',
    isInitialLoading: isLoading && stores.length === 0,
    fetchError,
    onPageChange,
    refetch,
    search: storeSearch,
  }
}
