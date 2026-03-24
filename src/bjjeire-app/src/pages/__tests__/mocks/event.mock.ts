import type { BjjEventDto } from '@/types/event'
import { BjjEventType, EventStatus, PricingType } from '@/types/event'
import { County } from '@/constants/counties'

export const MOCK_EVENT_FULL: BjjEventDto = {
  id: 'event-id-100',
  name: 'Dublin Open Mat 2026',
  type: BjjEventType.OpenMat,
  status: EventStatus.Upcoming,
  county: County.Dublin,
  organiser: {
    name: 'Dublin BJJ Association',
    website: 'https://dublinbjj.ie',
  },
  socialMedia: {
    instagram: 'https://instagram.com/dublinbjj',
    facebook: '',
    x: '',
    youTube: '',
  },
  location: {
    address: 'The National Sports Campus, Abbotstown, Dublin 15',
    venue: 'Sports Hall A',
    coordinates: { type: 'Point', latitude: 53.3792, longitude: -6.3574 },
  },
  schedule: {
    startDate: '2026-04-15',
    endDate: '2026-04-15',
    hours: [{ day: 'Saturday', openTime: '10:00', closeTime: '16:00' }],
  },
  pricing: { type: PricingType.FlatRate, amount: 15, currency: 'EUR' },
  eventUrl: 'https://dublinbjj.ie/open-mat-2026',
  imageUrl: 'https://example.com/images/dublin-open-mat.jpg',
  createdOnUtc: new Date().toISOString(),
  updatedOnUtc: new Date().toISOString(),
}

export const MOCK_EVENT_MINIMAL: BjjEventDto = {
  id: 'event-id-101',
  name: 'Cork Seminar',
  type: BjjEventType.Seminar,
  status: EventStatus.RegistrationOpen,
  county: County.Cork,
  organiser: {
    name: 'Cork Grappling Club',
    website: 'https://corkgrappling.ie',
  },
  socialMedia: { instagram: '', facebook: '', x: '', youTube: '' },
  location: {
    address: '10 Patrick Street, Cork',
    venue: 'Community Centre',
    coordinates: { type: 'Point', latitude: 51.8969, longitude: -8.4863 },
  },
  schedule: { startDate: '2026-05-01', endDate: null, hours: [] },
  pricing: { type: PricingType.Free, amount: 0, currency: 'EUR' },
  eventUrl: 'https://corkgrappling.ie/seminar',
  imageUrl: 'https://example.com/images/cork-seminar.jpg',
}
