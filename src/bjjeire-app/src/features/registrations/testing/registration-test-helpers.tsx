import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import { testApiUrl } from '@/testing/seed-helpers'
import type { DivisionDto } from '@/types/bjjeire-competitions'
import type {
  CancellationDto,
  ChangeDivisionCommand,
  CreateRegistrationCommand,
  DivisionCompetitorsDto,
  RegistrationCheckoutDto,
  RegistrationDto,
} from '@/types/registrations'
import SignUpPage from '@/pages/SignUpPage'
import SignUpCompletePage from '@/pages/SignUpCompletePage'
import MySignUpsPage from '@/pages/MySignUpsPage'

export const BJJEIRE_COMPETITIONS_API = testApiUrl(
  API_ROUTES.bjjEireCompetitions
)
export const REGISTRATION_API = testApiUrl(API_ROUTES.registration)

export interface Captured<T> {
  calls: T[]
  authorization: (string | null)[]
}

function captured<T>(): Captured<T> {
  return { calls: [], authorization: [] }
}

function problem(type: string, status = 409): Response {
  return HttpResponse.json(
    { type, status, title: 'Conflict', detail: 'from the API' },
    { status }
  )
}

export function seedEligibleDivisions(
  competitionId: string,
  divisions: DivisionDto[]
): Captured<null> {
  const seen = captured<null>()
  server.use(
    http.get(
      `${BJJEIRE_COMPETITIONS_API}/${competitionId}/eligible-division`,
      ({ request }) => {
        seen.calls.push(null)
        seen.authorization.push(request.headers.get('Authorization'))
        return HttpResponse.json(divisions)
      }
    )
  )
  return seen
}

export function seedEligibleDivisionsProblem(
  competitionId: string,
  type: string
): void {
  server.use(
    http.get(
      `${BJJEIRE_COMPETITIONS_API}/${competitionId}/eligible-division`,
      () => problem(type)
    )
  )
}

export function seedCreateRegistration(
  respond: RegistrationCheckoutDto | { problem: string; status?: number }
): Captured<CreateRegistrationCommand> {
  const seen = captured<CreateRegistrationCommand>()
  server.use(
    http.post(REGISTRATION_API, async ({ request }) => {
      seen.calls.push((await request.json()) as CreateRegistrationCommand)
      seen.authorization.push(request.headers.get('Authorization'))
      return 'problem' in respond
        ? problem(respond.problem, respond.status)
        : HttpResponse.json(respond, { status: 201 })
    })
  )
  return seen
}

export function seedResumeCheckout(
  registrationId: string,
  respond: RegistrationCheckoutDto | { problem: string }
): Captured<null> {
  const seen = captured<null>()
  server.use(
    http.post(`${REGISTRATION_API}/${registrationId}/checkout`, () => {
      seen.calls.push(null)
      return 'problem' in respond
        ? problem(respond.problem)
        : HttpResponse.json(respond)
    })
  )
  return seen
}

/** Answers each poll with the next list, then keeps repeating the last. */
export function seedOwnRegistrations(
  ...responses: RegistrationDto[][]
): Captured<null> {
  const seen = captured<null>()
  server.use(
    http.get(`${REGISTRATION_API}/me`, ({ request }) => {
      seen.authorization.push(request.headers.get('Authorization'))
      const index = Math.min(seen.calls.length, responses.length - 1)
      seen.calls.push(null)
      return HttpResponse.json(responses[index] ?? [])
    })
  )
  return seen
}

export function seedCancelRegistration(
  registrationId: string,
  respond: CancellationDto | { problem: string; status?: number }
): Captured<null> {
  const seen = captured<null>()
  server.use(
    http.post(`${REGISTRATION_API}/${registrationId}/cancel`, ({ request }) => {
      seen.calls.push(null)
      seen.authorization.push(request.headers.get('Authorization'))
      return 'problem' in respond
        ? problem(respond.problem, respond.status)
        : HttpResponse.json(respond)
    })
  )
  return seen
}

export function seedChangeDivision(
  registrationId: string,
  respond: RegistrationDto | { problem: string; status?: number }
): Captured<ChangeDivisionCommand> {
  const seen = captured<ChangeDivisionCommand>()
  server.use(
    http.put(
      `${REGISTRATION_API}/${registrationId}/division`,
      async ({ request }) => {
        seen.calls.push((await request.json()) as ChangeDivisionCommand)
        seen.authorization.push(request.headers.get('Authorization'))
        return 'problem' in respond
          ? problem(respond.problem, respond.status)
          : HttpResponse.json(respond)
      }
    )
  )
  return seen
}

export function seedBjjEireCompetitionCompetitors(
  competitionId: string,
  lists: DivisionCompetitorsDto[]
): void {
  server.use(
    http.get(`${BJJEIRE_COMPETITIONS_API}/${competitionId}/competitor`, () =>
      HttpResponse.json(lists)
    )
  )
}

const FLAGS = { BjjEireCompetitions: true }

export function renderSignUpPage(
  slug: string,
  registrationId?: string
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <Routes>
      <Route
        path={paths.bjjEireCompetitionSignUp.path}
        element={<SignUpPage />}
      />
    </Routes>,
    {
      initialRoutes: [
        paths.bjjEireCompetitionSignUp.getHref(slug, registrationId),
      ],
      featureFlags: FLAGS,
    }
  )
}

export function renderSignUpCompletePage(
  slug: string,
  registrationId: string
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <Routes>
      <Route
        path={paths.bjjEireCompetitionSignUpComplete.path}
        element={<SignUpCompletePage />}
      />
    </Routes>,
    {
      initialRoutes: [
        paths.bjjEireCompetitionSignUpComplete.getHref(slug, registrationId),
      ],
      featureFlags: FLAGS,
    }
  )
}

export function renderMySignUpsPage(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<MySignUpsPage />, {
    initialRoutes: [paths.accountSignUps.path],
    featureFlags: FLAGS,
  })
}
