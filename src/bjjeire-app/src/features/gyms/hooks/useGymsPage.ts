import { useCallback } from 'react'
import { COUNTIES } from '@/constants/counties'
import { env } from '@/config/env'
import type { GymDto, GetGymsByCountyPaginationQuery } from '@/types/gyms'
import { formatFetchError } from '@/utils/errorUtils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { getGyms } from '@/features/gyms/api/get-gyms'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { uiContent } from '@/config/ui-content'
import type { HateoasPagination } from '@/types/common'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { PaginatedResponse } from '@/types/common'

const { filters } = uiContent.gyms

const initialGymFilters: GetGymsByCountyPaginationQuery = {
  county: 'all',
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

interface UseGymsPageResult {
  gyms: GymDto[]
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
}

export function useGymsPage(): UseGymsPageResult {
  const scrollToTop = useScrollToTop()

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

  const gyms = paginatedGymsData ?? []

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
  }
}
