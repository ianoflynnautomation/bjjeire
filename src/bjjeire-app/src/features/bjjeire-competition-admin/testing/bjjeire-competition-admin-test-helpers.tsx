import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import { testApiUrl } from '@/testing/seed-helpers'
import { createPaginatedBjjEireCompetitions } from '@/testing/factories/bjjeire-competition.factory'
import { createPaginatedAdminRegistrations } from '@/testing/factories/registration.factory'
import type {
  AdminCancelCommand,
  AdminRegistrationDto,
  CancellationDto,
  ChangeDivisionCommand,
  MergeTeamsCommand,
  TeamMergeDto,
} from '@/types/registrations'
import type {
  BjjEireCompetitionCommand,
  BjjEireCompetitionDto,
  BjjEireCompetitionSummaryDto,
  UpdateBjjEireCompetitionCommand,
} from '@/types/bjjeire-competitions'
import AdminBjjEireCompetitionsPage from '@/pages/AdminBjjEireCompetitionsPage'
import AdminBjjEireCompetitionPage from '@/pages/AdminBjjEireCompetitionPage'

export const BJJEIRE_COMPETITIONS_API = testApiUrl(
  API_ROUTES.bjjEireCompetitions
)
export const BJJEIRE_COMPETITIONS_ADMIN_API = testApiUrl(
  API_ROUTES.bjjEireCompetitionsAdmin
)
export const ADMIN_EDIT_PROBE = 'admin-edit-probe'

export interface Captured<T> {
  calls: T[]
  authorization: (string | null)[]
}

function capture<T>(): Captured<T> {
  return { calls: [], authorization: [] }
}

export function seedAdminBjjEireCompetitions(
  bjjEireCompetitions: BjjEireCompetitionSummaryDto[]
): Captured<null> {
  const captured = capture<null>()
  server.use(
    http.get(BJJEIRE_COMPETITIONS_ADMIN_API, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(
        createPaginatedBjjEireCompetitions(bjjEireCompetitions, 1, 1)
      )
    })
  )
  return captured
}

export function seedAdminBjjEireCompetition(
  bjjEireCompetition: BjjEireCompetitionDto
): void {
  server.use(
    http.get(`${BJJEIRE_COMPETITIONS_ADMIN_API}/${bjjEireCompetition.id}`, () =>
      HttpResponse.json(bjjEireCompetition)
    )
  )
}

export function seedAdminBjjEireCompetitionMissing(id: string): void {
  server.use(
    http.get(`${BJJEIRE_COMPETITIONS_ADMIN_API}/${id}`, () =>
      HttpResponse.json({ type: 'urn:bjjeire:not-found' }, { status: 404 })
    )
  )
}

export function seedCreate(
  respond: (command: BjjEireCompetitionCommand) => BjjEireCompetitionDto
): Captured<BjjEireCompetitionCommand> {
  const captured = capture<BjjEireCompetitionCommand>()
  server.use(
    http.post(BJJEIRE_COMPETITIONS_API, async ({ request }) => {
      const command = (await request.json()) as BjjEireCompetitionCommand
      captured.calls.push(command)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(respond(command), { status: 201 })
    })
  )
  return captured
}

export function seedUpdate(
  id: string,
  respond: (command: UpdateBjjEireCompetitionCommand) => BjjEireCompetitionDto
): Captured<UpdateBjjEireCompetitionCommand> {
  const captured = capture<UpdateBjjEireCompetitionCommand>()
  server.use(
    http.put(`${BJJEIRE_COMPETITIONS_API}/${id}`, async ({ request }) => {
      const command = (await request.json()) as UpdateBjjEireCompetitionCommand
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
    http.put(`${BJJEIRE_COMPETITIONS_API}/${id}`, () =>
      HttpResponse.json({ ...problem, status }, { status })
    )
  )
}

export function seedPublish(
  id: string,
  published: BjjEireCompetitionDto
): Captured<null> {
  const captured = capture<null>()
  server.use(
    http.post(`${BJJEIRE_COMPETITIONS_API}/${id}/publish`, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(published)
    })
  )
  return captured
}

export function seedCancelBjjEireCompetition(
  id: string,
  cancelled: BjjEireCompetitionDto
): Captured<null> {
  const captured = capture<null>()
  server.use(
    http.post(`${BJJEIRE_COMPETITIONS_API}/${id}/cancel`, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(cancelled)
    })
  )
  return captured
}

/** Answers each read with the next list, then keeps repeating the last. */
export function seedAdminRegistrations(
  id: string,
  ...lists: AdminRegistrationDto[][]
): Captured<null> {
  const captured = capture<null>()
  server.use(
    http.get(
      `${BJJEIRE_COMPETITIONS_API}/${id}/registration`,
      ({ request }) => {
        const index = Math.min(captured.calls.length, lists.length - 1)
        captured.calls.push(null)
        captured.authorization.push(request.headers.get('Authorization'))
        if (new URL(request.url).searchParams.get('format') === 'csv') {
          return new HttpResponse('registrationId,displayName\r\n', {
            headers: { 'Content-Type': 'text/csv' },
          })
        }
        return HttpResponse.json(
          createPaginatedAdminRegistrations(lists[index] ?? [])
        )
      }
    )
  )
  return captured
}

export function seedAdminMove(
  id: string,
  registrationId: string,
  moved: AdminRegistrationDto
): Captured<ChangeDivisionCommand> {
  const captured = capture<ChangeDivisionCommand>()
  server.use(
    http.put(
      `${BJJEIRE_COMPETITIONS_API}/${id}/registration/${registrationId}/division`,
      async ({ request }) => {
        captured.calls.push((await request.json()) as ChangeDivisionCommand)
        captured.authorization.push(request.headers.get('Authorization'))
        return HttpResponse.json(moved)
      }
    )
  )
  return captured
}

export function seedAdminCancel(
  id: string,
  registrationId: string,
  outcome: CancellationDto
): Captured<AdminCancelCommand> {
  const captured = capture<AdminCancelCommand>()
  server.use(
    http.post(
      `${BJJEIRE_COMPETITIONS_API}/${id}/registration/${registrationId}/cancel`,
      async ({ request }) => {
        captured.calls.push((await request.json()) as AdminCancelCommand)
        captured.authorization.push(request.headers.get('Authorization'))
        return HttpResponse.json(outcome)
      }
    )
  )
  return captured
}

export function seedMerge(
  id: string,
  result: TeamMergeDto
): Captured<MergeTeamsCommand> {
  const captured = capture<MergeTeamsCommand>()
  server.use(
    http.post(
      `${BJJEIRE_COMPETITIONS_API}/${id}/team-merge`,
      async ({ request }) => {
        captured.calls.push((await request.json()) as MergeTeamsCommand)
        captured.authorization.push(request.headers.get('Authorization'))
        return HttpResponse.json(result)
      }
    )
  )
  return captured
}

const FLAGS = { BjjEireCompetitions: true }

export function renderAdminBjjEireCompetitionsPage(): ReturnType<
  typeof renderWithProviders
> {
  return renderWithProviders(
    <Routes>
      <Route
        path={paths.adminBjjEireCompetitions.path}
        element={<AdminBjjEireCompetitionsPage />}
      />
      <Route
        path={paths.adminBjjEireCompetition.path}
        element={<p data-testid={ADMIN_EDIT_PROBE} />}
      />
    </Routes>,
    {
      initialRoutes: [paths.adminBjjEireCompetitions.path],
      featureFlags: FLAGS,
    }
  )
}

export function renderAdminBjjEireCompetitionPage(
  id: string
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <Routes>
      <Route
        path={paths.adminBjjEireCompetition.path}
        element={<AdminBjjEireCompetitionPage />}
      />
    </Routes>,
    {
      initialRoutes: [paths.adminBjjEireCompetition.getHref(id)],
      featureFlags: FLAGS,
    }
  )
}
