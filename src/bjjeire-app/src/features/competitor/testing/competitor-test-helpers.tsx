import { http, HttpResponse } from 'msw'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import { testApiUrl } from '@/testing/seed-helpers'
import { createPaginatedGyms } from '@/testing/factories/gym.factory'
import { createUnsavedCompetitor } from '@/testing/factories/competitor.factory'
import type { GymDto } from '@/types/gyms'
import type {
  CompetitorDto,
  CompetitorHistoryDto,
  SaveCompetitorCommand,
} from '@/types/competitor'
import ProfilePage from '@/pages/ProfilePage'

export const COMPETITOR_ME_API = testApiUrl(`${API_ROUTES.competitor}/me`)
export const GYMS_API = testApiUrl(API_ROUTES.gyms)

export interface Captured<T> {
  calls: T[]
  authorization: (string | null)[]
}

export function seedOwnProfile(profile: CompetitorDto | null): Captured<null> {
  const captured: Captured<null> = { calls: [], authorization: [] }
  server.use(
    http.get(COMPETITOR_ME_API, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(
        profile ?? createUnsavedCompetitor('new@example.test')
      )
    })
  )
  return captured
}

export function seedOwnHistory(history: CompetitorHistoryDto): void {
  server.use(
    http.get(`${COMPETITOR_ME_API}/history`, () => HttpResponse.json(history))
  )
}

export function seedSaveProfile(
  respond: (command: SaveCompetitorCommand) => CompetitorDto
): Captured<SaveCompetitorCommand> {
  const captured: Captured<SaveCompetitorCommand> = {
    calls: [],
    authorization: [],
  }
  server.use(
    http.put(COMPETITOR_ME_API, async ({ request }) => {
      const command = (await request.json()) as SaveCompetitorCommand
      captured.calls.push(command)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(respond(command))
    })
  )
  return captured
}

export function seedDeleteAccount(status: 204 | 409 = 204): Captured<null> {
  const captured: Captured<null> = { calls: [], authorization: [] }
  server.use(
    http.delete(COMPETITOR_ME_API, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      return status === 204
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json(
            {
              type: 'urn:bjjeire:has-active-registration',
              status: 409,
              detail:
                'You have a sign-up that is awaiting payment or confirmed. Cancel it before deleting your account.',
            },
            { status: 409 }
          )
    })
  )
  return captured
}

export function seedDirectoryGyms(gyms: GymDto[]): void {
  server.use(
    http.get(GYMS_API, () => HttpResponse.json(createPaginatedGyms(gyms, 1, 1)))
  )
}

export function renderProfilePage(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<ProfilePage />, {
    initialRoutes: [paths.accountProfile.path],
    featureFlags: { Tournaments: true },
  })
}
