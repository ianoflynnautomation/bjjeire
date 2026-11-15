import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { API_BASE_PATH } from '@/config/api-routes'
import { server } from '@/testing/msw/server'
import { testApiUrl } from '@/testing/seed-helpers'

interface MockMsal {
  initialize: ReturnType<typeof vi.fn<() => Promise<void>>>
  getAllAccounts: ReturnType<typeof vi.fn<() => object[]>>
  acquireTokenSilent: ReturnType<
    typeof vi.fn<() => Promise<{ accessToken: string }>>
  >
  loginPopup: ReturnType<typeof vi.fn<() => Promise<object>>>
  logoutPopup: ReturnType<typeof vi.fn<(request?: object) => Promise<void>>>
}

const { adminMsal, competitorMsal } = vi.hoisted(() => {
  const make = (token: string): MockMsal => ({
    initialize: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    getAllAccounts: vi.fn<() => object[]>(() => []),
    acquireTokenSilent: vi.fn<() => Promise<{ accessToken: string }>>(() =>
      Promise.resolve({ accessToken: token })
    ),
    loginPopup: vi.fn<() => Promise<object>>(),
    logoutPopup: vi.fn<(request?: object) => Promise<void>>(() =>
      Promise.resolve()
    ),
  })
  return {
    adminMsal: make('organiser-token'),
    competitorMsal: make('competitor-token'),
  }
})

vi.mock('@/config/env', () => ({
  env: { API_URL: 'http://localhost' },
}))
vi.mock('@/lib/msal-config', () => ({
  msalInstance: adminMsal,
  loginRequest: { scopes: ['access_as_writer'] },
}))
vi.mock('@/lib/competitor-msal-config', () => ({
  competitorMsalInstance: competitorMsal,
  competitorLoginRequest: { scopes: ['access_as_competitor'] },
}))

const { api } = await import('@/lib/api-client')
const { hasCompetitorSession, signInCompetitor, signOutCompetitor } =
  await import('@/lib/competitor-auth')

const BASE = testApiUrl(API_BASE_PATH)

function captureAuthorization(
  method: 'get' | 'put' | 'post' | 'delete',
  path: string
): { header: string | null | undefined } {
  const seen: { header: string | null | undefined } = { header: undefined }
  server.use(
    http[method](`${BASE}/${path}`, ({ request }) => {
      seen.header = request.headers.get('Authorization')
      return HttpResponse.json({ ok: true })
    })
  )
  return seen
}

beforeEach(() => {
  adminMsal.getAllAccounts.mockReturnValue([{ username: 'owner' }])
  competitorMsal.getAllAccounts.mockReturnValue([{ username: 'aoife' }])
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('api client: the competitor token (ADR-0012)', () => {
  it.each([
    ['get', 'competitor/me'],
    ['put', 'competitor/me'],
    ['delete', 'competitor/me'],
    ['get', 'competitor/me/history'],
    ['get', 'registration/me'],
    ['post', 'registration'],
    ['get', 'tournament/0123456789abcdef01234567/eligible-division'],
  ] as const)(
    'given both people are signed in, when %s %s is sent, then the competitor token is attached and the organiser token is never fetched',
    async (method, path) => {
      const seen = captureAuthorization(method, path)

      await api[method](path)

      expect(seen.header).toBe('Bearer competitor-token')
      expect(adminMsal.acquireTokenSilent).not.toHaveBeenCalled()
    }
  )

  it('given the organiser is signed in, when an organiser write is sent, then the organiser token is attached, never the competitor one', async () => {
    const seen = captureAuthorization('post', 'tournament')

    await api.post('tournament', {})

    expect(seen.header).toBe('Bearer organiser-token')
    expect(competitorMsal.acquireTokenSilent).not.toHaveBeenCalled()
  })

  it('given no competitor is signed in, when a competitor route is called, then no token is attached', async () => {
    competitorMsal.getAllAccounts.mockReturnValue([])
    const seen = captureAuthorization('get', 'competitor/me')

    await api.get('competitor/me')

    expect(seen.header).toBeNull()
    expect(adminMsal.acquireTokenSilent).not.toHaveBeenCalled()
  })

  it('given a public tournament read, when it is sent, then no token of either kind is attached', async () => {
    const seen = captureAuthorization('get', 'tournament/bjjeire')

    await api.get('tournament/bjjeire')

    expect(seen.header).toBeNull()
    expect(competitorMsal.acquireTokenSilent).not.toHaveBeenCalled()
  })
})

describe('competitor auth with the competitor tenant', () => {
  it('given no account, when the competitor signs in through the popup, then they are signed in', async () => {
    competitorMsal.getAllAccounts
      .mockReturnValueOnce([])
      .mockReturnValue([{ username: 'aoife' }])

    expect(await hasCompetitorSession()).toBe(false)
    expect(await signInCompetitor()).toBe(true)
    expect(competitorMsal.loginPopup).toHaveBeenCalledWith({
      scopes: ['access_as_competitor'],
    })
    expect(adminMsal.loginPopup).not.toHaveBeenCalled()
  })

  it('given a signed-in competitor, when they sign out, then the competitor tenant signs them out', async () => {
    await signOutCompetitor()

    expect(competitorMsal.logoutPopup).toHaveBeenCalledWith(
      expect.objectContaining({ account: { username: 'aoife' } })
    )
    expect(adminMsal.logoutPopup).not.toHaveBeenCalled()
  })
})
