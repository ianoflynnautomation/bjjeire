import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { LeaderboardDto } from '@/types/bjjeire-competitions'
import { getBjjEireCompetitionLeaderboard } from '../api/get-bjjeire-competitions'

/** Query key of a competition's public leaderboard. */
export const bjjEireCompetitionLeaderboardKey = (id: string) =>
  ['bjjeire-competition-leaderboard', id] as const

/** The public leaderboard of a competition (FR-032 to FR-035, FR-040). */
export function useBjjEireCompetitionLeaderboard(
  competitionId: string
): UseQueryResult<LeaderboardDto> {
  return useQuery({
    queryKey: bjjEireCompetitionLeaderboardKey(competitionId),
    queryFn: () => getBjjEireCompetitionLeaderboard(competitionId),
  })
}
