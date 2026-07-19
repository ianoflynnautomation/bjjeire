import { API_ROUTES } from '@/config/api-routes'
import { renderWithProviders } from '@/testing/render-utils'
import { createListSeeds, testApiUrl } from '@/testing/seed-helpers'
import { createGym, createPaginatedGyms } from '@/testing/factories/gym.factory'
import type { GymDto } from '@/types/gyms'
import GymsPage from '@/pages/GymsPage'

export const GYMS_API = testApiUrl(API_ROUTES.gyms)

const seeds = createListSeeds<GymDto>(GYMS_API, createPaginatedGyms, () => [
  createGym(),
])

export const seedGyms = seeds.seed
export const seedGymsPaged = seeds.seedPaged
export const seedGymsError = seeds.seedError
export const seedGymsPending = seeds.seedPending

export function seedGymsByCounty(
  byCounty: Record<string, GymDto[]>,
  fallback: GymDto[] = []
): { getLastUrl: () => URL | null } {
  return seeds.seedByParam('county', byCounty, fallback)
}

export function renderGymsPage(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<GymsPage />, {
    featureFlags: { BjjEvents: true, Gyms: true },
  })
}
