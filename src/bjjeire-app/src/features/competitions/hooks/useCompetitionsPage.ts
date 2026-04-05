import { useCallback, useEffect, useMemo } from 'react'
import { env } from '@/config/env'
import type {
  CompetitionDto,
  GetCompetitionsPaginationQuery,
} from '@/types/competitions'
import { formatFetchError } from '@/utils/error-utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { getCompetitions } from '@/features/competitions/api/get-competitions'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import type { HateoasPagination, PaginatedResponse } from '@/types/common'
import type { QueryObserverResult } from '@tanstack/react-query'
import { useCompetitionSearch } from './useCompetitionSearch'
import type { UseCompetitionSearchResult } from './useCompetitionSearch'

const SEARCH_PAGE_SIZE = 200

const initialCompetitionFilters: GetCompetitionsPaginationQuery = {
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

interface UseCompetitionsPageResult {
  competitions: CompetitionDto[]
  filteredCompetitions: CompetitionDto[]
  paginationInfo: HateoasPagination | undefined
  isLoading: boolean
  isFetching: boolean
  currentPage: number
  formattedErrorMessage: string
  isInitialLoading: boolean
  fetchError: Error | null
  onPageChange: (url: string | null, page?: number) => void
  refetch: () => Promise<
    QueryObserverResult<PaginatedResponse<CompetitionDto>, Error>
  >
  search: UseCompetitionSearchResult
}

export function useCompetitionsPage(): UseCompetitionsPageResult {
  const scrollToTop = useScrollToTop()
  const competitionSearch = useCompetitionSearch()

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
  } = usePaginatedQuery<CompetitionDto, GetCompetitionsPaginationQuery>({
    queryKeyBase: ['competitions'],
    fetchFn: getCompetitions,
    initialParams: initialCompetitionFilters,
  })

  useEffect(() => {
    updateFilters({
      page: 1,
      pageSize: competitionSearch.isSearchActive
        ? SEARCH_PAGE_SIZE
        : env.PAGE_SIZE,
    } as Partial<GetCompetitionsPaginationQuery>)
  }, [competitionSearch.isSearchActive, updateFilters])

  const competitions = useMemo(() => paginatedData ?? [], [paginatedData])

  const filteredCompetitions = useMemo(
    () => competitionSearch.filterCompetitions(competitions),
    [competitionSearch, competitions]
  )

  const onPageChange = useCallback(
    (url: string | null, page?: number) => {
      rawHandlePageChange(url, page)
      scrollToTop()
    },
    [rawHandlePageChange, scrollToTop]
  )

  return {
    competitions,
    filteredCompetitions,
    paginationInfo,
    isLoading,
    isFetching,
    currentPage,
    formattedErrorMessage: formatFetchError(fetchError) ?? '',
    isInitialLoading: isLoading && competitions.length === 0,
    fetchError,
    onPageChange,
    refetch,
    search: competitionSearch,
  }
}
