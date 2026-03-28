import type { BjjEventDto } from '@/types/event'
import { BjjEventType, EventStatus, PricingType } from '@/types/event'
import type { PaginatedResponse } from '@/types/common'
import { County } from '@/constants/counties'

let _eventId = 0

export function resetEventIdCounter(): void {
  _eventId = 0
}

export function createEvent(overrides: Partial<BjjEventDto> = {}): BjjEventDto {
  const id = ++_eventId
  return {
    id: `event-id-${id}`,
    name: `Test Event ${id}`,
    type: BjjEventType.OpenMat,
    status: EventStatus.Upcoming,
    county: County.Dublin,
    organiser: { name: 'Test Organiser', website: 'https://example.com' },
    socialMedia: { instagram: '', facebook: '', x: '', youTube: '' },
    location: {
      address: `${id} Test Street, Dublin`,
      venue: 'Test Venue',
      coordinates: { type: 'Point', coordinates: [-6.26, 53.33] },
    },
    schedule: { startDate: '2026-04-01', endDate: null, hours: [] },
    pricing: { type: PricingType.Free, amount: 0, currency: 'EUR' },
    eventUrl: 'https://example.com/event',
    imageUrl: 'https://example.com/image.jpg',
    ...overrides,
  }
}

export function createPaginatedEvents(
  events: BjjEventDto[],
  page: number,
  totalPages: number
): PaginatedResponse<BjjEventDto> {
  return {
    data: events,
    pagination: {
      totalItems: events.length,
      currentPage: page,
      pageSize: 20,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPageUrl: page < totalPages ? `/api/bjjevent?page=${page + 1}` : null,
      previousPageUrl: page > 1 ? `/api/bjjevent?page=${page - 1}` : null,
    },
  }
}
