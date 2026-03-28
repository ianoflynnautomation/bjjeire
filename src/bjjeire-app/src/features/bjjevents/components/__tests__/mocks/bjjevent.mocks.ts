import type { BjjEventDto } from '@/types/event'
import { BjjEventType, PricingType, EventStatus } from '@/types/event'
import type { LocationDto, SocialMediaDto } from '@/types/common'
import { County } from '@/constants/counties'

const mockLocation: LocationDto = {
  address: '12 Grand Canal Dock, Dublin, D02 A1B2',
  venue: 'The Arena',
  coordinates: {
    type: 'Point',
    coordinates: [-6.2395, 53.3418],
    placeName: 'Grand Canal Dock',
    placeId: 'ChIJABC123',
  },
}

const mockSocialMedia: SocialMediaDto = {
  instagram: 'https://instagram.com/testevent',
  facebook: 'https://facebook.com/testevent',
  x: '',
  youTube: '',
}

export const MOCK_EVENT_FULL: BjjEventDto = {
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
  location: mockLocation,
  socialMedia: mockSocialMedia,
  schedule: {
    startDate: '2026-04-01T10:00:00Z',
    endDate: '2026-04-01T12:00:00Z',
    hours: [{ day: 'Tuesday', openTime: '10:00', closeTime: '12:00' }],
  },
  pricing: {
    type: PricingType.Free,
    amount: 0,
    currency: 'EUR',
  },
  eventUrl: 'https://grapplingireland.ie/events/dublin-open-mat',
  imageUrl: 'https://example.com/events/open-mat.jpg',
  createdOnUtc: new Date().toISOString(),
  updatedOnUtc: new Date().toISOString(),
}

export const MOCK_EVENT_MINIMAL: BjjEventDto = {
  id: 'event-id-002',
  name: 'Cork BJJ Seminar',
  type: BjjEventType.Seminar,
  county: County.Cork,
  status: EventStatus.RegistrationOpen,
  organiser: {
    name: 'Cork BJJ',
    website: '',
  },
  location: mockLocation,
  socialMedia: {},
  schedule: {
    hours: [],
  },
  pricing: {
    type: PricingType.FlatRate,
    amount: 40,
    currency: 'EUR',
  },
  eventUrl: '',
  imageUrl: '',
}

export const MOCK_EVENT_NO_URL: BjjEventDto = {
  ...MOCK_EVENT_FULL,
  id: 'event-id-003',
  eventUrl: '',
}
