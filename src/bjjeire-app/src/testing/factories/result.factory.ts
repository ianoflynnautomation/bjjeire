import type {
  AdminDivisionResultDto,
  LeaderboardDto,
  MedallistDto,
  PodiumDto,
  ResultCompetitorDto,
  TeamStandingDto,
} from '@/types/bjjeire-competitions'

let _registrationId = 0

export function resetResultIdCounter(): void {
  _registrationId = 0
}

/** No results yet: what a published competition serves before its first podium (#5034). */
export function createEmptyLeaderboard(
  overrides: Partial<LeaderboardDto> = {}
): LeaderboardDto {
  return {
    podiums: [],
    academyRanking: [],
    affiliationRanking: [],
    ...overrides,
  }
}

export function createMedallist(
  overrides: Partial<MedallistDto> = {}
): MedallistDto {
  return {
    displayName: 'Aoife Byrne',
    academy: 'Team X',
    affiliation: 'Alliance',
    ...overrides,
  }
}

export function createPodium(overrides: Partial<PodiumDto> = {}): PodiumDto {
  return {
    divisionId: 'division-id-1',
    gold: createMedallist(),
    silver: createMedallist({ displayName: 'Ciaran Byrne', academy: 'Team Y' }),
    bronzes: [
      createMedallist({ displayName: 'Niamh Byrne', academy: 'Team Z' }),
    ],
    pointsAwarded: true,
    ...overrides,
  }
}

export function createStanding(
  overrides: Partial<TeamStandingDto> = {}
): TeamStandingDto {
  return {
    rank: 1,
    name: 'Team X',
    points: 9,
    gold: 1,
    silver: 0,
    bronze: 0,
    ...overrides,
  }
}

export function createResultCompetitor(
  overrides: Partial<ResultCompetitorDto> = {}
): ResultCompetitorDto {
  const id = ++_registrationId
  return {
    registrationId: String(id).padStart(24, 'a'),
    displayName: `Competitor ${id}`,
    academy: 'Team X',
    affiliation: 'Alliance',
    ...overrides,
  }
}

export function createAdminDivisionResult(
  overrides: Partial<AdminDivisionResultDto> = {}
): AdminDivisionResultDto {
  return {
    divisionId: 'division-id-1',
    result: null,
    competitors: [],
    ...overrides,
  }
}
