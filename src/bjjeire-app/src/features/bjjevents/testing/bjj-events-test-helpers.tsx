import { http, HttpResponse } from 'msw'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import {
  createEvent,
  createPaginatedEvents,
} from '@/testing/factories/event.factory'
import type { BjjEventDto } from '@/types/event'
import type { PaginatedResponse } from '@/types/common'
import EventsPage from '@/pages/EventsPage'

export const EVENTS_API = 'http://localhost/api/api/bjjevent'

export function seedEvents(events: BjjEventDto[] = [createEvent()]): void {
  server.use(
    http.get(EVENTS_API, () =>
      HttpResponse.json(createPaginatedEvents(events, 1, 1))
    )
  )
}

export function seedEventsPaged(
  pages: Record<number, PaginatedResponse<BjjEventDto>>
): { getLastUrl: () => URL | null } {
  let lastUrl: URL | null = null
  server.use(
    http.get(EVENTS_API, ({ request }) => {
      lastUrl = new URL(request.url)
      const page = Number(lastUrl.searchParams.get('page') ?? 1)
      return HttpResponse.json(pages[page] ?? pages[1])
    })
  )
  return { getLastUrl: (): URL | null => lastUrl }
}

export function seedEventsByParam(
  paramName: string,
  byValue: Record<string, BjjEventDto[]>,
  fallback: BjjEventDto[] = []
): { getLastUrl: () => URL | null } {
  let lastUrl: URL | null = null
  server.use(
    http.get(EVENTS_API, ({ request }) => {
      lastUrl = new URL(request.url)
      const value = lastUrl.searchParams.get(paramName)
      const events = value ? (byValue[value] ?? fallback) : fallback
      return HttpResponse.json(createPaginatedEvents(events, 1, 1))
    })
  )
  return { getLastUrl: (): URL | null => lastUrl }
}

export function seedEventsError(status = 500): void {
  server.use(http.get(EVENTS_API, () => HttpResponse.json(null, { status })))
}

export function seedEventsPending(): void {
  server.use(http.get(EVENTS_API, () => new Promise(() => {})))
}

export function renderEventsPage(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<EventsPage />, {
    featureFlags: { BjjEvents: true, Gyms: true },
  })
}
