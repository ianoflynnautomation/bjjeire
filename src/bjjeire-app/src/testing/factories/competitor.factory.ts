import type {
  CompetitorDto,
  CompetitorHistoryDto,
  CompetitionMedalsDto,
} from '@/types/competitor'

export function createCompetitor(
  overrides: Partial<CompetitorDto> = {}
): CompetitorDto {
  return {
    email: 'aoife@example.test',
    firstName: 'Aoife',
    middleName: null,
    lastName: 'Byrne',
    nationality: 'IE',
    dateOfBirth: '1990-04-12',
    gender: 'FEMALE',
    belt: 'BLUE',
    academy: { gymId: null, name: 'Team X' },
    affiliation: 'Alliance',
    phone: null,
    address: null,
    profileComplete: true,
    saved: true,
    ...overrides,
  }
}

/** What the API returns before the competitor's first save. */
export function createUnsavedCompetitor(email: string): CompetitorDto {
  return {
    email,
    firstName: null,
    lastName: null,
    dateOfBirth: null,
    profileComplete: false,
    saved: false,
  }
}

export function createCompetitionMedals(
  overrides: Partial<CompetitionMedalsDto> = {}
): CompetitionMedalsDto {
  return {
    competitionId: '665624c1ad01ce465c6cf456',
    slug: 'bjjeire',
    name: 'BjjEire',
    date: '2026-06-27',
    gold: 1,
    silver: 0,
    bronze: 0,
    ...overrides,
  }
}

export function createCompetitorHistory(
  overrides: Partial<CompetitorHistoryDto> = {}
): CompetitorHistoryDto {
  return { gold: 0, silver: 0, bronze: 0, competitions: [], ...overrides }
}
