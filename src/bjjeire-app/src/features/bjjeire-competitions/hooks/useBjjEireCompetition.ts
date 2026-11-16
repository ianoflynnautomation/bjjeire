import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getBjjEireCompetition } from '@/features/bjjeire-competitions/api/get-bjjeire-competitions'
import type { BjjEireCompetitionDto } from '@/types/bjjeire-competitions'
import { formatFetchError } from '@/utils/error-utils'

export interface UseBjjEireCompetitionResult {
  bjjEireCompetition: BjjEireCompetitionDto | undefined
  isLoading: boolean
  /** The API has no public competition at this slug: unknown, or still a draft. */
  isNotFound: boolean
  error: Error | null
  formattedErrorMessage: string
  refetch: () => unknown
}

export function useBjjEireCompetition(
  slug: string
): UseBjjEireCompetitionResult {
  const { data, isLoading, error, refetch } = useQuery<BjjEireCompetitionDto>({
    queryKey: ['bjjeire-competition', slug],
    queryFn: () => getBjjEireCompetition(slug),
    enabled: slug !== '',
  })
  const isNotFound =
    slug === '' || (isAxiosError(error) && error.response?.status === 404)

  return {
    bjjEireCompetition: data,
    isLoading,
    isNotFound,
    error,
    formattedErrorMessage: formatFetchError(error),
    refetch,
  }
}
