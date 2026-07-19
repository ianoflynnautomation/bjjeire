import type { CompetitionDto } from '@/types/competitions'
import type { PaginatedResponse } from '@/types/common'

let _competitionId = 0

export function resetCompetitionIdCounter(): void {
  _competitionId = 0
}

export function createCompetition(
  overrides: Partial<CompetitionDto> = {}
): CompetitionDto {
  const id = ++_competitionId
  return {
    id: `competition-id-${id}`,
    slug: `test-competition-${id}`,
    name: `Test Competition ${id}`,
    organisation: 'IBJJF',
    country: 'Ireland',
    websiteUrl: `https://example.com/competition-${id}`,
    tags: [],
    startDate: `2026-06-01T00:00:00Z`,
    endDate: `2026-06-01T00:00:00Z`,
    isActive: true,
    ...overrides,
  }
}

export function createPaginatedCompetitions(
  competitions: CompetitionDto[],
  page: number,
  totalPages: number
): PaginatedResponse<CompetitionDto> {
  return {
    data: competitions,
    pagination: {
      totalItems: competitions.length,
      currentPage: page,
      pageSize: 20,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPageUrl:
        page < totalPages ? `/api/v1/competition?page=${page + 1}` : null,
      previousPageUrl: page > 1 ? `/api/v1/competition?page=${page - 1}` : null,
    },
  }
}
