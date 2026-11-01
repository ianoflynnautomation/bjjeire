import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_PATH } from '@/config/api-routes'
import { server } from '@/testing/msw/server'
import { testApiUrl } from '@/testing/seed-helpers'

const { msalModuleLoaded, initialize, getAllAccounts } = vi.hoisted(() => ({
  msalModuleLoaded: vi.fn(),
  initialize: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  getAllAccounts: vi.fn<() => object[]>(() => []),
}))

vi.mock('@/config/env', () => ({
  env: { API_URL: 'http://localhost' },
}))

vi.mock('@/lib/msal-config', () => {
  msalModuleLoaded()
  return {
    msalInstance: { initialize, getAllAccounts, acquireTokenSilent: vi.fn() },
    loginRequest: { scopes: ['test-scope'] },
  }
})

const BASE = testApiUrl(API_BASE_PATH)

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('MSAL loading', () => {
  it('given a public GET, when it is sent, then the MSAL bundle is never loaded', async () => {
    server.use(http.get(`${BASE}/items`, () => HttpResponse.json({ ok: true })))
    const { api } = await import('@/lib/api-client')

    await api.get('items')

    expect(msalModuleLoaded).not.toHaveBeenCalled()
  })

  it('given a write, when it is sent, then MSAL is initialised before accounts are read', async () => {
    server.use(
      http.post(`${BASE}/items`, () => HttpResponse.json({ ok: true }))
    )
    const { api } = await import('@/lib/api-client')

    await api.post('items', { name: 'x' })

    expect(msalModuleLoaded).toHaveBeenCalledOnce()
    expect(initialize).toHaveBeenCalledOnce()
    expect(initialize.mock.invocationCallOrder[0]).toBeLessThan(
      getAllAccounts.mock.invocationCallOrder[0] ?? 0
    )
  })

  it('given MSAL fails to initialise, when a write is sent, then it rejects instead of going out unauthenticated', async () => {
    initialize.mockRejectedValueOnce(new Error('MSAL init failed'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const requestReachedServer = vi.fn()
    server.use(
      http.post(`${BASE}/items`, () => {
        requestReachedServer()
        return HttpResponse.json({ ok: true })
      })
    )
    const { api } = await import('@/lib/api-client')

    await expect(api.post('items', { name: 'x' })).rejects.toThrow(
      'MSAL init failed'
    )
    expect(requestReachedServer).not.toHaveBeenCalled()
  })
})
