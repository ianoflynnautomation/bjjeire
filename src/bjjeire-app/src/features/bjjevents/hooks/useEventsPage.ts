import { useCallback } from 'react'
import type { County } from '@/constants/counties'
import type { GetBjjEventsPaginationQuery, BjjEventDto } from '@/types/event'
import type { BjjEventType } from '@/types/event'
import { env } from '@/config/env'
import { formatFetchError } from '@/utils/error-utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { getBjjEvents } from '@/features/bjjevents/api/get-bjj-events'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import type { HateoasPagination } from '@/types/common'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { PaginatedResponse } from '@/types/common'

const initialEventFilters: GetBjjEventsPaginationQuery = {
  county: 'all',
  type: 'all',
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

interface UseEventsPageResult {
  events: BjjEventDto[]
  paginationInfo: HateoasPagination | undefined
  isLoading: boolean
  isFetching: boolean
  activeFilters: GetBjjEventsPaginationQuery
  currentPage: number
  formattedErrorMessage: string
  isInitialLoading: boolean
  fetchError: Error | null
  handleFilterChange: (
    key: keyof Omit<GetBjjEventsPaginationQuery, 'page' | 'pageSize'>,
    value: County | BjjEventType | 'all' | undefined
  ) => void
  onPageChange: (url: string | null, page?: number) => void
  refetch: () => Promise<
    QueryObserverResult<PaginatedResponse<BjjEventDto>, Error>
  >
}

export function useEventsPage(): UseEventsPageResult {
  const scrollToTop = useScrollToTop()

  const {
    data: paginatedEventsData,
    pagination: paginationInfo,
    isLoading,
    isFetching,
    error: fetchError,
    params: activeFilters,
    currentPage,
    handlePageChange: rawHandlePageChange,
    updateFilters,
    refetch,
  } = usePaginatedQuery<BjjEventDto, GetBjjEventsPaginationQuery>({
    queryKeyBase: ['bjjevents'],
    fetchFn: getBjjEvents,
    initialParams: initialEventFilters,
  })

  const events = paginatedEventsData ?? []

  const handleFilterChange = useCallback(
    (
      key: keyof Omit<GetBjjEventsPaginationQuery, 'page' | 'pageSize'>,
      value: County | BjjEventType | 'all' | undefined
    ) => {
      updateFilters({ [key]: value } as Partial<GetBjjEventsPaginationQuery>)
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
    events,
    paginationInfo,
    isLoading,
    isFetching,
    activeFilters,
    currentPage,
    formattedErrorMessage: formatFetchError(fetchError) ?? '',
    isInitialLoading: isLoading && events.length === 0,
    fetchError,
    handleFilterChange,
    onPageChange,
    refetch,
  }
}
