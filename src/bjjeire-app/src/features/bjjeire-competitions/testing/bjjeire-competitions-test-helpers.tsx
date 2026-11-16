import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import { createListSeeds, testApiUrl } from '@/testing/seed-helpers'
import {
  createPaginatedBjjEireCompetitions,
  createBjjEireCompetitionSummary,
} from '@/testing/factories/bjjeire-competition.factory'
import type {
  BjjEireCompetitionDto,
  BjjEireCompetitionSummaryDto,
} from '@/types/bjjeire-competitions'
import BjjEireCompetitionPage from '@/pages/BjjEireCompetitionPage'

export const BJJEIRE_COMPETITIONS_API = testApiUrl(
  API_ROUTES.bjjEireCompetitions
)

const seeds = createListSeeds<BjjEireCompetitionSummaryDto>(
  BJJEIRE_COMPETITIONS_API,
  createPaginatedBjjEireCompetitions,
  () => [createBjjEireCompetitionSummary()]
)

export const seedBjjEireCompetitions = seeds.seed
export const seedBjjEireCompetitionsError = seeds.seedError
export const seedBjjEireCompetitionsPending = seeds.seedPending

export function seedBjjEireCompetition(
  bjjEireCompetition: BjjEireCompetitionDto
): void {
  server.use(
    http.get(`${BJJEIRE_COMPETITIONS_API}/${bjjEireCompetition.slug}`, () =>
      HttpResponse.json(bjjEireCompetition)
    )
  )
}

export function seedBjjEireCompetitionStatus(
  slug: string,
  status: number
): void {
  server.use(
    http.get(`${BJJEIRE_COMPETITIONS_API}/${slug}`, () =>
      HttpResponse.json(
        { type: 'urn:bjjeire:not-found', title: 'Resource Not Found', status },
        { status }
      )
    )
  )
}

const FLAGS = { BjjEireCompetitions: true }

export function renderBjjEireCompetitionPage(
  slug: string
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <Routes>
      <Route
        path={paths.bjjEireCompetition.path}
        element={<BjjEireCompetitionPage />}
      />
    </Routes>,
    {
      initialRoutes: [paths.bjjEireCompetition.getHref(slug)],
      featureFlags: FLAGS,
    }
  )
}
