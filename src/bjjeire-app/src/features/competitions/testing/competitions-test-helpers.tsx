import { API_ROUTES } from '@/config/api-routes'
import { renderWithProviders } from '@/testing/render-utils'
import { createListSeeds, testApiUrl } from '@/testing/seed-helpers'
import {
  createCompetition,
  createPaginatedCompetitions,
} from '@/testing/factories/competition.factory'
import type { CompetitionDto } from '@/types/competitions'
import CompetitionsPage from '@/pages/CompetitionsPage'

export const COMPETITIONS_API = testApiUrl(API_ROUTES.competitions)

const seeds = createListSeeds<CompetitionDto>(
  COMPETITIONS_API,
  createPaginatedCompetitions,
  () => [createCompetition()]
)

export const seedCompetitions = seeds.seed
export const seedCompetitionsError = seeds.seedError
export const seedCompetitionsPending = seeds.seedPending

export function renderCompetitionsPage(): ReturnType<
  typeof renderWithProviders
> {
  return renderWithProviders(<CompetitionsPage />, {
    featureFlags: {
      BjjEvents: true,
      Gyms: true,
      Competitions: true,
    },
  })
}
