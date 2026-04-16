import { http, HttpResponse } from 'msw'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import {
  createCompetition,
  createPaginatedCompetitions,
} from '@/testing/factories/competition.factory'
import type { CompetitionDto } from '@/types/competitions'
import CompetitionsPage from '@/pages/CompetitionsPage'

export const COMPETITIONS_API = 'http://localhost/api/api/competition'

export function seedCompetitions(
  competitions: CompetitionDto[] = [createCompetition()]
): void {
  server.use(
    http.get(COMPETITIONS_API, () =>
      HttpResponse.json(createPaginatedCompetitions(competitions, 1, 1))
    )
  )
}

export function seedCompetitionsError(status = 500): void {
  server.use(
    http.get(COMPETITIONS_API, () => HttpResponse.json(null, { status }))
  )
}

export function seedCompetitionsPending(): void {
  server.use(http.get(COMPETITIONS_API, () => new Promise(() => {})))
}

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
