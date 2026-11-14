import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getTournament } from '@/features/tournaments/api/get-tournaments'
import type { TournamentDto } from '@/types/tournaments'
import { formatFetchError } from '@/utils/error-utils'

export interface UseTournamentResult {
  tournament: TournamentDto | undefined
  isLoading: boolean
  /** The API has no public tournament at this slug: unknown, or still a draft. */
  isNotFound: boolean
  error: Error | null
  formattedErrorMessage: string
  refetch: () => unknown
}

export function useTournament(slug: string): UseTournamentResult {
  const { data, isLoading, error, refetch } = useQuery<TournamentDto>({
    queryKey: ['tournament', slug],
    queryFn: () => getTournament(slug),
    enabled: slug !== '',
  })
  const isNotFound =
    slug === '' || (isAxiosError(error) && error.response?.status === 404)

  return {
    tournament: data,
    isLoading,
    isNotFound,
    error,
    formattedErrorMessage: formatFetchError(error),
    refetch,
  }
}
