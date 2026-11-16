import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import type { AdminRegistrationDto } from '@/types/registrations'
import { getTournamentRegistrations } from '../api/tournament-admin-api'
import { adminRegistrationsKey } from '../api/query-keys'

/** The organiser's sign-up list of one tournament, a page of 100 at a time (FR-006). */
export function useAdminRegistrations(
  tournamentId: string
): ReturnType<
  typeof usePaginatedQuery<AdminRegistrationDto, { page?: number }>
> {
  return usePaginatedQuery<AdminRegistrationDto, { page?: number }>({
    queryKeyBase: [...adminRegistrationsKey(tournamentId)],
    fetchFn: ({ page }) => getTournamentRegistrations(tournamentId, page ?? 1),
    initialParams: { page: 1 },
  })
}
