import { http, HttpResponse } from 'msw'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import {
  createGym,
  createPaginatedGyms,
} from '@/testing/factories/gym.factory'
import type { GymDto } from '@/types/gyms'
import type { PaginatedResponse } from '@/types/common'
import GymsPage from '@/pages/GymsPage'

export const GYMS_API = 'http://localhost/api/api/gym'

export function seedGyms(gyms: GymDto[] = [createGym()]): void {
  server.use(
    http.get(GYMS_API, () =>
      HttpResponse.json(createPaginatedGyms(gyms, 1, 1))
    )
  )
}

export function seedGymsPaged(
  pages: Record<number, PaginatedResponse<GymDto>>
): { getLastUrl: () => URL | null } {
  let lastUrl: URL | null = null
  server.use(
    http.get(GYMS_API, ({ request }) => {
      lastUrl = new URL(request.url)
      const page = Number(lastUrl.searchParams.get('page') ?? 1)
      return HttpResponse.json(pages[page] ?? pages[1])
    })
  )
  return { getLastUrl: (): URL | null => lastUrl }
}

export function seedGymsByCounty(
  byCounty: Record<string, GymDto[]>,
  fallback: GymDto[] = []
): { getLastUrl: () => URL | null } {
  let lastUrl: URL | null = null
  server.use(
    http.get(GYMS_API, ({ request }) => {
      lastUrl = new URL(request.url)
      const county = lastUrl.searchParams.get('county')
      const gyms = county ? (byCounty[county] ?? fallback) : fallback
      return HttpResponse.json(createPaginatedGyms(gyms, 1, 1))
    })
  )
  return { getLastUrl: (): URL | null => lastUrl }
}

export function seedGymsError(status = 500): void {
  server.use(
    http.get(GYMS_API, () => HttpResponse.json(null, { status }))
  )
}

export function seedGymsPending(): void {
  server.use(http.get(GYMS_API, () => new Promise(() => {})))
}

export function renderGymsPage(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<GymsPage />, {
    featureFlags: { BjjEvents: true, Gyms: true },
  })
}
