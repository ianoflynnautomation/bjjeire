import type { PaginatedResponse } from '@/types/common'
import type {
  DivisionDto,
  TournamentDto,
  TournamentSummaryDto,
} from '@/types/tournaments'

let _tournamentId = 0
let _divisionId = 0

export function resetTournamentIdCounter(): void {
  _tournamentId = 0
  _divisionId = 0
}

export function createDivision(
  overrides: Partial<DivisionDto> = {}
): DivisionDto {
  const id = ++_divisionId
  return {
    id: `division-id-${id}`,
    discipline: 'GI',
    gender: 'MALE',
    ageCategory: 'ADULT',
    belt: 'WHITE',
    weightClass: '-76 kg',
    ...overrides,
  }
}

function base(id: number): Omit<TournamentSummaryDto, 'divisionCount'> {
  return {
    id: `tournament-id-${id}`,
    slug: `test-tournament-${id}`,
    name: `Test Tournament ${id}`,
    date: '2026-06-27',
    venue: { address: '1 Main Street, Dublin', venue: 'National Arena' },
    entryFeeCents: 2500,
    currency: 'EUR',
    // Summer time in Ireland: 10:00 and 21:00 Irish time.
    registrationOpensAt: '2026-06-01T09:00:00Z',
    registrationClosesAt: '2026-06-20T20:00:00Z',
    competitorLimit: null,
    placesTaken: 0,
    status: 'PUBLISHED',
    registrationState: 'OPEN',
  }
}

export function createTournamentSummary(
  overrides: Partial<TournamentSummaryDto> = {}
): TournamentSummaryDto {
  return { ...base(++_tournamentId), divisionCount: 1, ...overrides }
}

export function createTournament(
  overrides: Partial<TournamentDto> = {}
): TournamentDto {
  return {
    ...base(++_tournamentId),
    description: 'An in-house tournament.',
    divisions: [createDivision()],
    version: 0,
    ...overrides,
  }
}

export function createPaginatedTournaments(
  tournaments: TournamentSummaryDto[],
  page: number,
  totalPages: number
): PaginatedResponse<TournamentSummaryDto> {
  return {
    data: tournaments,
    pagination: {
      totalItems: tournaments.length,
      currentPage: page,
      pageSize: 20,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPageUrl:
        page < totalPages ? `/api/v1/tournament?page=${page + 1}` : null,
      previousPageUrl: page > 1 ? `/api/v1/tournament?page=${page - 1}` : null,
    },
  }
}
