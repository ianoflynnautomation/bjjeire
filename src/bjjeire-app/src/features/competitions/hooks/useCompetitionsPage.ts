import { env } from '@/config/env'
import type {
  CompetitionDto,
  GetCompetitionsPaginationQuery,
} from '@/types/competitions'
import { useListPage, type UseListPageResult } from '@/hooks/useListPage'
import { getCompetitions } from '@/features/competitions/api/get-competitions'

const initialCompetitionFilters: GetCompetitionsPaginationQuery = {
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

function competitionMatchesSearch(
  competition: CompetitionDto,
  term: string
): boolean {
  const lower = term.toLowerCase()
  return (
    competition.name.toLowerCase().includes(lower) ||
    (competition.description?.toLowerCase().includes(lower) ?? false) ||
    competition.country.toLowerCase().includes(lower) ||
    competition.organisation.toLowerCase().includes(lower) ||
    competition.tags.some(t => t.toLowerCase().includes(lower))
  )
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
