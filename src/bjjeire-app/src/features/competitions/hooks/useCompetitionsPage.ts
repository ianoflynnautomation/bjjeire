import { env } from '@/config/env'
import type {
  CompetitionDto,
  GetCompetitionsPaginationQuery,
} from '@/types/competitions'
import { useListPage, type UseListPageResult } from '@/hooks/useListPage'
import { getCompetitions } from '@/features/competitions/api/get-competitions'
import { textMatchesSearch } from '@/utils/search-text'

export const initialCompetitionFilters: GetCompetitionsPaginationQuery = {
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

function competitionMatchesSearch(
  competition: CompetitionDto,
  term: string
): boolean {
  return textMatchesSearch(competition.name, term)
}

export type UseCompetitionsPageResult = UseListPageResult<
  CompetitionDto,
  GetCompetitionsPaginationQuery
>

export function useCompetitionsPage(): UseCompetitionsPageResult {
  return useListPage<CompetitionDto, GetCompetitionsPaginationQuery>({
    queryKeyBase: ['competitions'],
    fetchFn: getCompetitions,
    initialParams: initialCompetitionFilters,
    matchesSearch: competitionMatchesSearch,
  })
}
