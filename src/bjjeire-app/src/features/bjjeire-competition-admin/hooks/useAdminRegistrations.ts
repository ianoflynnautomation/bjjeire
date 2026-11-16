import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import type { AdminRegistrationDto } from '@/types/registrations'
import { getBjjEireCompetitionRegistrations } from '../api/bjjeire-competition-admin-api'
import { adminRegistrationsKey } from '../api/query-keys'

/** The organiser's sign-up list of one competition, a page of 100 at a time (FR-006). */
export function useAdminRegistrations(
  competitionId: string
): ReturnType<
  typeof usePaginatedQuery<AdminRegistrationDto, { page?: number }>
> {
  return usePaginatedQuery<AdminRegistrationDto, { page?: number }>({
    queryKeyBase: [...adminRegistrationsKey(competitionId)],
    fetchFn: ({ page }) =>
      getBjjEireCompetitionRegistrations(competitionId, page ?? 1),
    initialParams: { page: 1 },
  })
}
