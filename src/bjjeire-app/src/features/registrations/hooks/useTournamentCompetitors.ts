import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { DivisionCompetitorsDto } from '@/types/registrations'
import { getTournamentCompetitors } from '../api/registration-api'
import { tournamentCompetitorsKey } from '../api/query-keys'

/** The public competitor list of a tournament. */
export function useTournamentCompetitors(
  tournamentId: string
): UseQueryResult<DivisionCompetitorsDto[]> {
  return useQuery({
    queryKey: tournamentCompetitorsKey(tournamentId),
    queryFn: () => getTournamentCompetitors(tournamentId),
  })
}
