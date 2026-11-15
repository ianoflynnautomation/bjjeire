import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { CompetitorDto } from '@/types/competitor'
import { getOwnProfile } from '../api/competitor-api'
import { OWN_PROFILE_KEY } from '../api/query-keys'

/** The caller's profile. Before their first save it has `saved: false` and only the email. */
export function useOwnProfile(): UseQueryResult<CompetitorDto> {
  return useQuery({ queryKey: OWN_PROFILE_KEY, queryFn: getOwnProfile })
}
