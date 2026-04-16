import type { BjjEventDto, BjjEventScheduleDto } from '@/types/event'
import { BjjEventType, PricingType, EventStatus } from '@/types/event'
import type { LocationDto } from '@/types/common'
import { County } from '@/constants/counties'
import { createEvent } from '@/testing/factories/event.factory'

const location: LocationDto = {
  address: '12 Grand Canal Dock, Dublin, D02 A1B2',
  venue: 'The Arena',
  coordinates: {
    type: 'Point',
    coordinates: [-6.2395, 53.3418],
    latitude: 53.3418,
    longitude: -6.2395,
    placeName: 'Grand Canal Dock',
    placeId: 'ChIJABC123',
  },
}

const fullSchedule: BjjEventScheduleDto = {
  startDate: '2026-04-01T10:00:00Z',
  endDate: '2026-04-01T12:00:00Z',
  hours: [{ day: 'Tuesday', openTime: '10:00', closeTime: '12:00' }],
}

export const MOCK_EVENT_FULL: BjjEventDto = createEvent({
  id: 'event-id-001',
  name: 'Dublin Open Mat',
  description: 'A friendly open mat session for all levels.',
  type: BjjEventType.OpenMat,
  county: County.Dublin,
  status: EventStatus.Upcoming,
  organiser: {
    name: 'Grappling Ireland',
    website: 'https://grapplingireland.ie',
  },
  location,
  socialMedia: {
    instagram: 'https://instagram.com/testevent',
    facebook: 'https://facebook.com/testevent',
    x: '',
    youTube: '',
  },
  schedule: fullSchedule,
  pricing: { type: PricingType.Free, amount: 0, currency: 'EUR' },
  eventUrl: 'https://grapplingireland.ie/events/dublin-open-mat',
  imageUrl: 'https://example.com/events/open-mat.jpg',
})

export const MOCK_EVENT_MINIMAL: BjjEventDto = createEvent({
  id: 'event-id-002',
  name: 'Cork BJJ Seminar',
  type: BjjEventType.Seminar,
  county: County.Cork,
  status: EventStatus.RegistrationOpen,
  organiser: { name: 'Cork BJJ', website: '' },
  location,
  socialMedia: {},
  schedule: { hours: [] },
  pricing: { type: PricingType.FlatRate, amount: 40, currency: 'EUR' },
  eventUrl: '',
  imageUrl: '',
})

export const MOCK_EVENT_NO_URL: BjjEventDto = createEvent({
  ...MOCK_EVENT_FULL,
  id: 'event-id-003',
  eventUrl: '',
})
