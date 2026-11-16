import type { PaginatedResponse } from '@/types/common'
import type {
  DivisionDto,
  BjjEireCompetitionDto,
  BjjEireCompetitionSummaryDto,
} from '@/types/bjjeire-competitions'

let _competitionId = 0
let _divisionId = 0

export function resetBjjEireCompetitionIdCounter(): void {
  _competitionId = 0
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

function base(id: number): Omit<BjjEireCompetitionSummaryDto, 'divisionCount'> {
  return {
    id: `bjjeire-competition-id-${id}`,
    slug: `test-bjjeire-competition-${id}`,
    name: `Test Competition ${id}`,
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

export function createBjjEireCompetitionSummary(
  overrides: Partial<BjjEireCompetitionSummaryDto> = {}
): BjjEireCompetitionSummaryDto {
  return { ...base(++_competitionId), divisionCount: 1, ...overrides }
}

export function createBjjEireCompetition(
  overrides: Partial<BjjEireCompetitionDto> = {}
): BjjEireCompetitionDto {
  return {
    ...base(++_competitionId),
    description: 'An in-house competition.',
    divisions: [createDivision()],
    version: 0,
    ...overrides,
  }
}

export function createPaginatedBjjEireCompetitions(
  bjjEireCompetitions: BjjEireCompetitionSummaryDto[],
  page: number,
  totalPages: number
): PaginatedResponse<BjjEireCompetitionSummaryDto> {
  return {
    data: bjjEireCompetitions,
    pagination: {
      totalItems: bjjEireCompetitions.length,
      currentPage: page,
      pageSize: 20,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPageUrl:
        page < totalPages
          ? `/api/v1/bjjeire-competition?page=${page + 1}`
          : null,
      previousPageUrl:
        page > 1 ? `/api/v1/bjjeire-competition?page=${page - 1}` : null,
    },
  }
}
