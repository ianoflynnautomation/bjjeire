import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { DivisionCompetitorsDto } from '@/types/registrations'
import { getBjjEireCompetitionCompetitors } from '../api/registration-api'
import { bjjEireCompetitionCompetitorsKey } from '../api/query-keys'

/** The public competitor list of a competition. */
export function useBjjEireCompetitionCompetitors(
  competitionId: string
): UseQueryResult<DivisionCompetitorsDto[]> {
  return useQuery({
    queryKey: bjjEireCompetitionCompetitorsKey(competitionId),
    queryFn: () => getBjjEireCompetitionCompetitors(competitionId),
  })
}
