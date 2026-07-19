import { API_ROUTES } from '@/config/api-routes'
import { renderWithProviders } from '@/testing/render-utils'
import { createListSeeds, testApiUrl } from '@/testing/seed-helpers'
import {
  createEvent,
  createPaginatedEvents,
} from '@/testing/factories/event.factory'
import type { BjjEventDto } from '@/types/event'
import EventsPage from '@/pages/EventsPage'

export const EVENTS_API = testApiUrl(API_ROUTES.bjjEvents)

const seeds = createListSeeds<BjjEventDto>(
  EVENTS_API,
  createPaginatedEvents,
  () => [createEvent()]
)

export const seedEvents = seeds.seed
export const seedEventsPaged = seeds.seedPaged
export const seedEventsByParam = seeds.seedByParam
export const seedEventsError = seeds.seedError
export const seedEventsPending = seeds.seedPending

export function renderEventsPage(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<EventsPage />, {
    featureFlags: { BjjEvents: true, Gyms: true },
  })
}
