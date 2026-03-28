import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest'

const { mockMsalInstance } = vi.hoisted(() => ({
  mockMsalInstance: {
    getAllAccounts: vi.fn<() => object[]>(() => []),
    acquireTokenSilent: vi.fn(),
  },
}))

vi.mock('@/config/env', () => ({
  env: { API_URL: 'http://localhost/api' },
}))

vi.mock('@/lib/msal-config', () => ({
  msalInstance: mockMsalInstance,
  loginRequest: { scopes: ['test-scope'] },
}))

const { api } = await import('@/lib/api-client')

const BASE = 'http://localhost/api'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

describe('api.get', () => {
  it('returns the response data', async () => {
    server.use(
      http.get(`${BASE}/items`, () =>
        HttpResponse.json({ id: 1, name: 'Test' })
      )
    )
    const result = await api.get<{ id: number; name: string }>('items')
    expect(result).toEqual({ id: 1, name: 'Test' })
  })

  it('passes query params to the request', async () => {
    let receivedUrl = ''
    server.use(
      http.get(`${BASE}/items`, ({ request }) => {
        receivedUrl = request.url
        return HttpResponse.json([])
      })
    )
    await api.get('items', { params: { page: 2, size: 10 } })
    expect(receivedUrl).toContain('page=2')
    expect(receivedUrl).toContain('size=10')
  })

  it('rejects on a 404 response', async () => {
    server.use(
      http.get(`${BASE}/items`, () => HttpResponse.json(null, { status: 404 }))
    )
    await expect(api.get('items')).rejects.toThrow()
  })

  it('rejects on a 500 response', async () => {
    server.use(
      http.get(`${BASE}/items`, () => HttpResponse.json(null, { status: 500 }))
    )
    await expect(api.get('items')).rejects.toThrow()
  })
})

describe('api.post', () => {
  it('sends the request body and returns response data', async () => {
    let receivedBody: unknown
    server.use(
      http.post(`${BASE}/items`, async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ id: 99 }, { status: 201 })
      })
    )
    const result = await api.post<{ id: number }>('items', { name: 'New item' })
    expect(receivedBody).toEqual({ name: 'New item' })
    expect(result).toEqual({ id: 99 })
  })
})

describe('api.put', () => {
  it('sends the request body and returns response data', async () => {
    let receivedBody: unknown
    server.use(
      http.put(`${BASE}/items/1`, async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ id: 1, name: 'Updated' })
      })
    )
    const result = await api.put<{ id: number; name: string }>('items/1', {
      name: 'Updated',
    })
    expect(receivedBody).toEqual({ name: 'Updated' })
    expect(result).toEqual({ id: 1, name: 'Updated' })
  })
})

describe('api.delete', () => {
  it('returns the response data', async () => {
    server.use(
      http.delete(`${BASE}/items/1`, () => HttpResponse.json({ deleted: true }))
    )
    const result = await api.delete<{ deleted: boolean }>('items/1')
    expect(result).toEqual({ deleted: true })
  })
})

describe('request interceptor — auth', () => {
  it('adds Authorization header when an MSAL account is present', async () => {
    mockMsalInstance.getAllAccounts.mockReturnValue([
      { username: 'user@test.com' },
    ])
    mockMsalInstance.acquireTokenSilent.mockResolvedValue({
      accessToken: 'test-token',
    })

    let authHeader: string | null = null
    server.use(
      http.get(`${BASE}/protected`, ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await api.get('protected')
    expect(authHeader).toBe('Bearer test-token')
  })

  it('does not add Authorization header when no account is present', async () => {
    mockMsalInstance.getAllAccounts.mockReturnValue([])

    let authHeader: string | null = null
    server.use(
      http.get(`${BASE}/public`, ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await api.get('public')
    expect(authHeader).toBeNull()
  })

  it('proceeds without Authorization header when acquireTokenSilent throws', async () => {
    mockMsalInstance.getAllAccounts.mockReturnValue([
      { username: 'user@test.com' },
    ])
    mockMsalInstance.acquireTokenSilent.mockRejectedValue(
      new Error('Token expired')
    )
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    let authHeader: string | null = null
    server.use(
      http.get(`${BASE}/fallback`, ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await api.get('fallback')
    expect(authHeader).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(
      'Silent token acquisition failed — proceeding without auth:',
      expect.any(Error)
    )
  })
})

describe('response interceptor — error logging', () => {
  it('logs API error details when the server returns a non-2xx status', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(
      http.get(`${BASE}/fail`, () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 })
      )
    )

    await api.get('fail').catch(() => {})

    expect(consoleSpy).toHaveBeenCalledWith(
      'API error:',
      expect.objectContaining({ status: 404 })
    )
  })
})
