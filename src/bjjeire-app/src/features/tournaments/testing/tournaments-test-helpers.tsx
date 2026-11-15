import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import { createListSeeds, testApiUrl } from '@/testing/seed-helpers'
import {
  createPaginatedTournaments,
  createTournamentSummary,
} from '@/testing/factories/tournament.factory'
import type { TournamentDto, TournamentSummaryDto } from '@/types/tournaments'
import TournamentsPage from '@/pages/TournamentsPage'
import TournamentPage from '@/pages/TournamentPage'

export const TOURNAMENTS_API = testApiUrl(API_ROUTES.tournaments)

const seeds = createListSeeds<TournamentSummaryDto>(
  TOURNAMENTS_API,
  createPaginatedTournaments,
  () => [createTournamentSummary()]
)

export const seedTournaments = seeds.seed
export const seedTournamentsError = seeds.seedError
export const seedTournamentsPending = seeds.seedPending

export function seedTournament(tournament: TournamentDto): void {
  server.use(
    http.get(`${TOURNAMENTS_API}/${tournament.slug}`, () =>
      HttpResponse.json(tournament)
    )
  )
}

export function seedTournamentStatus(slug: string, status: number): void {
  server.use(
    http.get(`${TOURNAMENTS_API}/${slug}`, () =>
      HttpResponse.json(
        { type: 'urn:bjjeire:not-found', title: 'Resource Not Found', status },
        { status }
      )
    )
  )
}

const FLAGS = { Tournaments: true }

export function renderTournamentsPage(): ReturnType<
  typeof renderWithProviders
> {
  return renderWithProviders(<TournamentsPage />, {
    initialRoutes: [paths.tournaments.path],
    featureFlags: FLAGS,
  })
}

export function renderTournamentPage(
  slug: string
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <Routes>
      <Route path={paths.tournament.path} element={<TournamentPage />} />
    </Routes>,
    { initialRoutes: [paths.tournament.getHref(slug)], featureFlags: FLAGS }
  )
}
