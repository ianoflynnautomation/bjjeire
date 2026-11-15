import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import { testApiUrl } from '@/testing/seed-helpers'
import { createPaginatedTournaments } from '@/testing/factories/tournament.factory'
import type {
  TournamentCommand,
  TournamentDto,
  TournamentSummaryDto,
  UpdateTournamentCommand,
} from '@/types/tournaments'
import AdminTournamentsPage from '@/pages/AdminTournamentsPage'
import AdminTournamentPage from '@/pages/AdminTournamentPage'

export const TOURNAMENTS_API = testApiUrl(API_ROUTES.tournaments)
export const TOURNAMENTS_ADMIN_API = testApiUrl(API_ROUTES.tournamentsAdmin)
export const ADMIN_EDIT_PROBE = 'admin-edit-probe'

export interface Captured<T> {
  calls: T[]
  authorization: (string | null)[]
}

function capture<T>(): Captured<T> {
  return { calls: [], authorization: [] }
}

export function seedAdminTournaments(
  tournaments: TournamentSummaryDto[]
): Captured<null> {
  const captured = capture<null>()
  server.use(
    http.get(TOURNAMENTS_ADMIN_API, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(createPaginatedTournaments(tournaments, 1, 1))
    })
  )
  return captured
}

export function seedAdminTournament(tournament: TournamentDto): void {
  server.use(
    http.get(`${TOURNAMENTS_ADMIN_API}/${tournament.id}`, () =>
      HttpResponse.json(tournament)
    )
  )
}

export function seedAdminTournamentMissing(id: string): void {
  server.use(
    http.get(`${TOURNAMENTS_ADMIN_API}/${id}`, () =>
      HttpResponse.json({ type: 'urn:bjjeire:not-found' }, { status: 404 })
    )
  )
}

export function seedCreate(
  respond: (command: TournamentCommand) => TournamentDto
): Captured<TournamentCommand> {
  const captured = capture<TournamentCommand>()
  server.use(
    http.post(TOURNAMENTS_API, async ({ request }) => {
      const command = (await request.json()) as TournamentCommand
      captured.calls.push(command)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(respond(command), { status: 201 })
    })
  )
  return captured
}

export function seedUpdate(
  id: string,
  respond: (command: UpdateTournamentCommand) => TournamentDto
): Captured<UpdateTournamentCommand> {
  const captured = capture<UpdateTournamentCommand>()
  server.use(
    http.put(`${TOURNAMENTS_API}/${id}`, async ({ request }) => {
      const command = (await request.json()) as UpdateTournamentCommand
      captured.calls.push(command)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(respond(command))
    })
  )
  return captured
}

export function seedUpdateProblem(
  id: string,
  status: number,
  problem: { type: string; detail: string }
): void {
  server.use(
    http.put(`${TOURNAMENTS_API}/${id}`, () =>
      HttpResponse.json({ ...problem, status }, { status })
    )
  )
}

export function seedPublish(
  id: string,
  published: TournamentDto
): Captured<null> {
  const captured = capture<null>()
  server.use(
    http.post(`${TOURNAMENTS_API}/${id}/publish`, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(published)
    })
  )
  return captured
}

const FLAGS = { Tournaments: true }

export function renderAdminTournamentsPage(): ReturnType<
  typeof renderWithProviders
> {
  return renderWithProviders(
    <Routes>
      <Route
        path={paths.adminTournaments.path}
        element={<AdminTournamentsPage />}
      />
      <Route
        path={paths.adminTournament.path}
        element={<p data-testid={ADMIN_EDIT_PROBE} />}
      />
    </Routes>,
    { initialRoutes: [paths.adminTournaments.path], featureFlags: FLAGS }
  )
}

export function renderAdminTournamentPage(
  id: string
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <Routes>
      <Route
        path={paths.adminTournament.path}
        element={<AdminTournamentPage />}
      />
    </Routes>,
    { initialRoutes: [paths.adminTournament.getHref(id)], featureFlags: FLAGS }
  )
}
