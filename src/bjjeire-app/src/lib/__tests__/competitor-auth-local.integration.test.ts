import { http, HttpResponse } from 'msw'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { server } from '@/testing/msw/server'
import { testApiUrl } from '@/testing/seed-helpers'

const { msalUsed } = vi.hoisted(() => ({ msalUsed: vi.fn() }))

vi.mock('@/config/env', () => ({
  env: { API_URL: 'http://localhost', LOCAL_SIGN_IN: true },
}))

// Local sign-in must never load or call either MSAL configuration.
vi.mock('@/lib/msal-config', () => {
  msalUsed()
  return {}
})
vi.mock('@/lib/competitor-msal-config', () => {
  msalUsed()
  return {}
})

const {
  getCompetitorToken,
  hasCompetitorSession,
  signInCompetitor,
  signOutCompetitor,
  LOCAL_COMPETITOR_SESSION_KEY,
} = await import('@/lib/competitor-auth')
const { LOCAL_SESSION_KEY } = await import('@/lib/admin-auth')

const SIGN_IN = testApiUrl(`${API_ROUTES.localSignIn}/competitor`)

beforeEach(() => {
  sessionStorage.clear()
})

describe('competitor auth with local sign-in (ADR-0014)', () => {
  it('given nobody has signed in, when the session is checked, then there is none and no token', async () => {
    expect(await hasCompetitorSession()).toBe(false)
    expect(await getCompetitorToken()).toBeNull()
  })

  it('given an email, when the competitor signs in, then the API issues a token for that email and it is kept apart from the organiser session', async () => {
    let sentBody: unknown
    server.use(
      http.post(SIGN_IN, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({
          accessToken: 'competitor-local-token',
          expiresAt: '2999-01-01T00:00:00Z',
        })
      })
    )

    expect(await signInCompetitor('aoife@example.test')).toBe(true)

    expect(sentBody).toEqual({ email: 'aoife@example.test' })
    expect(await hasCompetitorSession()).toBe(true)
    expect(await getCompetitorToken()).toBe('competitor-local-token')
    expect(sessionStorage.getItem(LOCAL_COMPETITOR_SESSION_KEY)).toContain(
      'competitor-local-token'
    )
    expect(sessionStorage.getItem(LOCAL_SESSION_KEY)).toBeNull()
    expect(msalUsed).not.toHaveBeenCalled()
  })

  it('given a signed-in competitor, when they sign out, then the token is gone', async () => {
    sessionStorage.setItem(
      LOCAL_COMPETITOR_SESSION_KEY,
      JSON.stringify({ accessToken: 't', expiresAt: '2999-01-01T00:00:00Z' })
    )

    await signOutCompetitor()

    expect(await hasCompetitorSession()).toBe(false)
    expect(await getCompetitorToken()).toBeNull()
  })

  it('given the API refuses, when the competitor signs in, then they stay signed out', async () => {
    server.use(http.post(SIGN_IN, () => HttpResponse.json({}, { status: 404 })))

    expect(await signInCompetitor('aoife@example.test')).toBe(false)
    expect(await hasCompetitorSession()).toBe(false)
  })

  it('given an expired session, when the session is checked, then it is dropped', async () => {
    sessionStorage.setItem(
      LOCAL_COMPETITOR_SESSION_KEY,
      JSON.stringify({ accessToken: 't', expiresAt: '2000-01-01T00:00:00Z' })
    )

    expect(await hasCompetitorSession()).toBe(false)
    expect(sessionStorage.getItem(LOCAL_COMPETITOR_SESSION_KEY)).toBeNull()
  })
})
