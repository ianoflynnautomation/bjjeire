import { env } from '@/config/env'
import type {
  GetTournamentsPaginationQuery,
  TournamentSummaryDto,
} from '@/types/tournaments'
import { useListPage, type UseListPageResult } from '@/hooks/useListPage'
import { getTournaments } from '@/features/tournaments/api/get-tournaments'
import { textMatchesSearch } from '@/utils/search-text'

export const initialTournamentFilters: GetTournamentsPaginationQuery = {
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

function tournamentMatchesSearch(
  tournament: TournamentSummaryDto,
  term: string
): boolean {
  return textMatchesSearch(tournament.name, term)
}

export type UseTournamentsPageResult = UseListPageResult<
  TournamentSummaryDto,
  GetTournamentsPaginationQuery
>

export function useTournamentsPage(): UseTournamentsPageResult {
  return useListPage<TournamentSummaryDto, GetTournamentsPaginationQuery>({
    queryKeyBase: ['tournaments'],
    fetchFn: getTournaments,
    initialParams: initialTournamentFilters,
    matchesSearch: tournamentMatchesSearch,
  })
}
