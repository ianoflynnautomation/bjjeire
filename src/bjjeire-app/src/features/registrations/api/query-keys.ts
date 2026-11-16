import { COMPETITOR_KEY } from '@/features/competitor/api/query-keys'

/** Under the competitor key, so signing out forgets them. */
export const OWN_REGISTRATIONS_KEY = [
  ...COMPETITOR_KEY,
  'registrations',
] as const
export const eligibleDivisionsKey = (tournamentId: string) =>
  [...COMPETITOR_KEY, 'eligible-divisions', tournamentId] as const
export const tournamentCompetitorsKey = (tournamentId: string) =>
  ['tournament-competitors', tournamentId] as const
