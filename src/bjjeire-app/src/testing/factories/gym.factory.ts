import type { GymDto } from '@/types/gyms'
import { GymStatus } from '@/types/gyms'
import type { PaginatedResponse } from '@/types/common'

let _gymId = 0

export function resetGymIdCounter(): void {
  _gymId = 0
}

export function createGym(overrides: Partial<GymDto> = {}): GymDto {
  const id = ++_gymId
  return {
    id: `gym-id-${id}`,
    name: `Test Gym ${id}`,
    status: GymStatus.Active,
    county: 'Dublin',
    trialOffer: { isAvailable: false },
    location: {
      address: `${id} Test Street, Dublin`,
      venue: 'Test Venue',
      coordinates: { type: 'Point', coordinates: [-6.26, 53.33] },
    },
    socialMedia: { instagram: '', facebook: '', x: '', youTube: '' },
    offeredClasses: [],
    ...overrides,
  }
}

export function createPaginatedGyms(
  gyms: GymDto[],
  page: number,
  totalPages: number
): PaginatedResponse<GymDto> {
  return {
    data: gyms,
    pagination: {
      totalItems: gyms.length,
      currentPage: page,
      pageSize: 20,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPageUrl: page < totalPages ? `/api/gym?page=${page + 1}` : null,
      previousPageUrl: page > 1 ? `/api/gym?page=${page - 1}` : null,
    },
  }
}
