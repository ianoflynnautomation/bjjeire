import { useCallback, useEffect, useMemo } from 'react'
import { COUNTIES } from '@/constants/counties'
import { env } from '@/config/env'
import type { GymDto, GetGymsByCountyPaginationQuery } from '@/types/gyms'
import { formatFetchError } from '@/utils/error-utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { getGyms } from '@/features/gyms/api/get-gyms'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { uiContent } from '@/config/ui-content'
import type { HateoasPagination } from '@/types/common'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { PaginatedResponse } from '@/types/common'
import { useGymSearch } from './useGymSearch'
import type { UseGymSearchResult } from './useGymSearch'

const { filters } = uiContent.gyms

const SEARCH_PAGE_SIZE = 200

const initialGymFilters: GetGymsByCountyPaginationQuery = {
  county: 'all',
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

interface UseGymsPageResult {
  gyms: GymDto[]
  filteredGyms: GymDto[]
  paginationInfo: HateoasPagination | undefined
  isLoading: boolean
  isFetching: boolean
  activeFilters: GetGymsByCountyPaginationQuery
  currentPage: number
  countyLabel: string
  formattedErrorMessage: string
  isInitialLoading: boolean
  fetchError: Error | null
  handleCountyChange: (countyValue: string | undefined) => void
  onPageChange: (url: string | null, page?: number) => void
  refetch: () => Promise<QueryObserverResult<PaginatedResponse<GymDto>, Error>>
  search: UseGymSearchResult
}

export function useGymsPage(): UseGymsPageResult {
  const scrollToTop = useScrollToTop()
  const gymSearch = useGymSearch()

  const {
    data: paginatedGymsData,
    pagination: paginationInfo,
    isLoading,
    isFetching,
    error: fetchError,
    params: activeFilters,
    currentPage,
    handlePageChange: rawHandlePageChange,
    updateFilters,
    refetch,
  } = usePaginatedQuery<GymDto, GetGymsByCountyPaginationQuery>({
    queryKeyBase: ['gyms'],
    fetchFn: getGyms,
    initialParams: initialGymFilters,
  })

  useEffect(() => {
    updateFilters({
      page: 1,
      pageSize: gymSearch.isSearchActive ? SEARCH_PAGE_SIZE : env.PAGE_SIZE,
    } as Partial<GetGymsByCountyPaginationQuery>)
  }, [gymSearch.isSearchActive, updateFilters])

  const gyms = useMemo(() => paginatedGymsData ?? [], [paginatedGymsData])

  const filteredGyms = useMemo(
    () => gymSearch.filterGyms(gyms),
    [gymSearch, gyms]
  )

  const countyLabel =
    COUNTIES.find(c => c.value === activeFilters.county)?.label ??
    (activeFilters.county === 'all'
      ? filters.allCountiesOption
      : activeFilters.county) ??
    filters.allCountiesOption

  const handleCountyChange = useCallback(
    (countyValue: string | undefined) => {
      updateFilters({
        county: countyValue,
      } as Partial<GetGymsByCountyPaginationQuery>)
      scrollToTop()
    },
    [updateFilters, scrollToTop]
  )

  const onPageChange = useCallback(
    (url: string | null, page?: number) => {
      rawHandlePageChange(url, page)
      scrollToTop()
    },
    [rawHandlePageChange, scrollToTop]
  )

  return {
    gyms,
    filteredGyms,
    paginationInfo,
    isLoading,
    isFetching,
    activeFilters,
    currentPage,
    countyLabel,
    formattedErrorMessage: formatFetchError(fetchError) ?? '',
    isInitialLoading: isLoading && gyms.length === 0,
    fetchError,
    handleCountyChange,
    onPageChange,
    refetch,
    search: gymSearch,
  }
}
