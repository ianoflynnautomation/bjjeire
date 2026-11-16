import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { DivisionDto } from '@/types/tournaments'
import { getEligibleDivisions } from '../api/registration-api'
import { eligibleDivisionsKey } from '../api/query-keys'

/** The divisions the signed-in competitor may enter; a 409 explains why none are offered. */
export function useEligibleDivisions(
  tournamentId: string | undefined,
  enabled: boolean
): UseQueryResult<DivisionDto[]> {
  return useQuery({
    queryKey: eligibleDivisionsKey(tournamentId ?? ''),
    queryFn: () => getEligibleDivisions(tournamentId ?? ''),
    enabled: enabled && tournamentId !== undefined,
    // A refusal (under 18, profile incomplete) is an answer, not a failure to retry.
    retry: false,
  })
}
