import { isAxiosError } from 'axios'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { CompetitorDto } from '@/types/competitor'
import { getOwnProfile } from '../api/competitor-api'
import { OWN_PROFILE_KEY } from '../api/query-keys'

/** The caller's profile, or null before their first save (the API answers 404). */
export function useOwnProfile(): UseQueryResult<CompetitorDto | null> {
  return useQuery({
    queryKey: OWN_PROFILE_KEY,
    queryFn: async () => {
      try {
        return await getOwnProfile()
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
  })
}
