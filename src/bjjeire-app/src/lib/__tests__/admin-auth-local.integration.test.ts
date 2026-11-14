import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { server } from '@/testing/msw/server'
import { testApiUrl } from '@/testing/seed-helpers'

const { msalUsed } = vi.hoisted(() => ({ msalUsed: vi.fn() }))

vi.mock('@/config/env', () => ({
  env: { API_URL: 'http://localhost', LOCAL_SIGN_IN: true },
}))

// Local sign-in must never load or call MSAL.
vi.mock('@/lib/msal-config', () => {
  msalUsed()
  return {}
})

const { getAdminToken, hasAdminSession, signInAdmin, LOCAL_SESSION_KEY } =
  await import('@/lib/admin-auth')
const { api } = await import('@/lib/api-client')

const SIGN_IN = testApiUrl(API_ROUTES.localSignIn)

function seedSignIn(token: string, expiresAt: string): { calls: number } {
  const seen = { calls: 0 }
  server.use(
    http.post(SIGN_IN, () => {
      seen.calls += 1
      return HttpResponse.json({ accessToken: token, expiresAt })
    })
  )
  return seen
}

beforeEach(() => {
  sessionStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('admin auth with local sign-in (ADR-0014)', () => {
  it('given nobody has signed in, when the session is checked, then there is none and no token', async () => {
    expect(await hasAdminSession()).toBe(false)
    expect(await getAdminToken()).toBeNull()
  })

  it('given local sign-in, when the organiser signs in, then the API issues a token that is kept for the session', async () => {
    const signIn = seedSignIn('local-token', '2999-01-01T00:00:00Z')

    expect(await signInAdmin()).toBe(true)

    expect(signIn.calls).toBe(1)
    expect(await hasAdminSession()).toBe(true)
    expect(await getAdminToken()).toBe('local-token')
    expect(sessionStorage.getItem(LOCAL_SESSION_KEY)).toContain('local-token')
    expect(msalUsed).not.toHaveBeenCalled()
  })

  it('given a stored token past its expiry, when the session is checked, then it is dropped', async () => {
    sessionStorage.setItem(
      LOCAL_SESSION_KEY,
      JSON.stringify({
        accessToken: 'old',
        expiresAt: '2000-01-01T00:00:00Z',
      })
    )

    expect(await hasAdminSession()).toBe(false)
    expect(await getAdminToken()).toBeNull()
    expect(sessionStorage.getItem(LOCAL_SESSION_KEY)).toBeNull()
  })

  it('given an API without local sign-in, when the organiser signs in, then sign-in fails and nothing is kept', async () => {
    server.use(
      http.post(SIGN_IN, () => HttpResponse.json(null, { status: 404 }))
    )

    expect(await signInAdmin()).toBe(false)
    expect(await hasAdminSession()).toBe(false)
  })

  it('given a local session, when an admin read and a write are sent, then both carry the local token and a public read does not', async () => {
    seedSignIn('local-token', '2999-01-01T00:00:00Z')
    await signInAdmin()
    const seen: Record<string, string | null> = {}
    server.use(
      http.get(testApiUrl(API_ROUTES.tournamentsAdmin), ({ request }) => {
        seen.adminRead = request.headers.get('Authorization')
        return HttpResponse.json({})
      }),
      http.post(testApiUrl(API_ROUTES.tournaments), ({ request }) => {
        seen.write = request.headers.get('Authorization')
        return HttpResponse.json({})
      }),
      http.get(testApiUrl(API_ROUTES.tournaments), ({ request }) => {
        seen.publicRead = request.headers.get('Authorization')
        return HttpResponse.json({})
      })
    )

    await api.get('tournament/admin')
    await api.post('tournament', {})
    await api.get('tournament')

    expect(seen).toEqual({
      adminRead: 'Bearer local-token',
      write: 'Bearer local-token',
      publicRead: null,
    })
    expect(msalUsed).not.toHaveBeenCalled()
  })
})
