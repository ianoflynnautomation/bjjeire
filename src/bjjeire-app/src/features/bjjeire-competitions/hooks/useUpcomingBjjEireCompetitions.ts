import { useQuery } from '@tanstack/react-query'
import { useFeatureFlag } from '@/features/feature-flags'
import { getBjjEireCompetitions } from '@/features/bjjeire-competitions/api/get-bjjeire-competitions'
import type { BjjEireCompetitionSummaryDto } from '@/types/bjjeire-competitions'

/** The API's maximum page size; the featured section shows every upcoming competition on one page. */
const UPCOMING_PAGE_SIZE = 100

/**
 * Upcoming BJJ Éire competitions for the featured section (#3006, research R6).
 *
 * The API already returns only upcoming ones, earliest day first (R3). While the
 * request is loading or after it fails this returns an empty list, so the
 * directory listing never waits for it or shows its error. It makes no request
 * while the BjjEireCompetitions flag is off (#3014).
 */
export function useUpcomingBjjEireCompetitions(): BjjEireCompetitionSummaryDto[] {
  const enabled = useFeatureFlag('BjjEireCompetitions')
  const { data } = useQuery({
    queryKey: ['bjjeire-competitions', 'upcoming'],
    queryFn: () =>
      getBjjEireCompetitions({ page: 1, pageSize: UPCOMING_PAGE_SIZE }),
    enabled,
    retry: false,
  })
  return enabled ? (data?.data ?? []) : []
}
