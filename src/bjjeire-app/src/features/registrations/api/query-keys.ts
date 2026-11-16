import { COMPETITOR_KEY } from '@/features/competitor/api/query-keys'

/** Under the competitor key, so signing out forgets them. */
export const OWN_REGISTRATIONS_KEY = [
  ...COMPETITOR_KEY,
  'registrations',
] as const
export const eligibleDivisionsKey = (competitionId: string) =>
  [...COMPETITOR_KEY, 'eligible-divisions', competitionId] as const
export const bjjEireCompetitionCompetitorsKey = (competitionId: string) =>
  ['bjjeire-competition-competitors', competitionId] as const
