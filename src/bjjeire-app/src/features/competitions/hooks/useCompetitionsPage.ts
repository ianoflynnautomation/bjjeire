import { env } from '@/config/env'
import type {
  CompetitionDto,
  GetCompetitionsPaginationQuery,
} from '@/types/competitions'
import { useListPage, type UseListPageResult } from '@/hooks/useListPage'
import { getCompetitions } from '@/features/competitions/api/get-competitions'
import { asArray, readString } from '@/utils/untrusted'

export const initialCompetitionFilters: GetCompetitionsPaginationQuery = {
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

function competitionMatchesSearch(
  competition: CompetitionDto,
  term: string
): boolean {
  const lower = term.toLowerCase()
  return (
    readString(competition.name).toLowerCase().includes(lower) ||
    readString(competition.description).toLowerCase().includes(lower) ||
    readString(competition.country).toLowerCase().includes(lower) ||
    readString(competition.organisation).toLowerCase().includes(lower) ||
    asArray(competition.tags).some(tag =>
      readString(tag).toLowerCase().includes(lower)
    )
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
