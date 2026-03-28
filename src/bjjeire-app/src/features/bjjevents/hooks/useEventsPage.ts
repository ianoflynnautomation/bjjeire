import { useCallback, useEffect, useMemo } from 'react'
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
import { useEventSearch } from './useEventSearch'
import type { UseEventSearchResult } from './useEventSearch'

const SEARCH_PAGE_SIZE = 200

const initialEventFilters: GetBjjEventsPaginationQuery = {
  county: 'all',
  type: 'all',
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

interface UseEventsPageResult {
  events: BjjEventDto[]
  filteredEvents: BjjEventDto[]
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
  search: UseEventSearchResult
}

export function useEventsPage(): UseEventsPageResult {
  const scrollToTop = useScrollToTop()
  const eventSearch = useEventSearch()

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

  useEffect(() => {
    updateFilters({
      page: 1,
      pageSize: eventSearch.isSearchActive ? SEARCH_PAGE_SIZE : env.PAGE_SIZE,
    } as Partial<GetBjjEventsPaginationQuery>)
  }, [eventSearch.isSearchActive, updateFilters])

  const events = useMemo(() => paginatedEventsData ?? [], [paginatedEventsData])

  const filteredEvents = useMemo(
    () => eventSearch.filterEvents(events),
    [eventSearch, events]
  )

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
    filteredEvents,
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
    search: eventSearch,
  }
}
