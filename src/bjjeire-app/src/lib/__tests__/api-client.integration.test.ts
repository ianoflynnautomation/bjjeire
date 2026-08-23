import { http, HttpResponse } from 'msw'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { API_BASE_PATH } from '@/config/api-routes'
import { server } from '@/testing/msw/server'
import { testApiUrl } from '@/testing/seed-helpers'

const { mockMsalInstance } = vi.hoisted(() => ({
  mockMsalInstance: {
    getAllAccounts: vi.fn<() => object[]>(() => []),
    acquireTokenSilent: vi.fn(),
  },
}))

vi.mock('@/config/env', () => ({
  env: { API_URL: 'http://localhost' },
}))

vi.mock('@/lib/msal-config', () => ({
  msalInstance: mockMsalInstance,
  loginRequest: { scopes: ['test-scope'] },
}))

const { api } = await import('@/lib/api-client')

const BASE = testApiUrl(API_BASE_PATH)

afterEach(() => {
  vi.clearAllMocks()
})

describe('api.get', () => {
  it('given a successful GET, when the request resolves, then the response data is returned', async () => {
    server.use(
      http.get(`${BASE}/items`, () =>
        HttpResponse.json({ id: 1, name: 'Test' })
      )
    )
    const result = await api.get<{ id: number; name: string }>('items')
    expect(result).toEqual({ id: 1, name: 'Test' })
  })

  it('given query params, when a GET is made, then the params appear in the request URL', async () => {
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

  it('given a 404 response, when a GET is made, then the request rejects', async () => {
    server.use(
      http.get(`${BASE}/items`, () => HttpResponse.json(null, { status: 404 }))
    )
    await expect(api.get('items')).rejects.toThrow()
  })

  it('given a 500 response, when a GET is made, then the request rejects', async () => {
    server.use(
      http.get(`${BASE}/items`, () => HttpResponse.json(null, { status: 500 }))
    )
    await expect(api.get('items')).rejects.toThrow()
  })
})

describe('api.post', () => {
  it('given a POST body, when the request resolves, then the body is sent and response data returned', async () => {
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
  it('given a PUT body, when the request resolves, then the body is sent and response data returned', async () => {
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
  it('given a successful DELETE, when the request resolves, then the response data is returned', async () => {
    server.use(
      http.delete(`${BASE}/items/1`, () => HttpResponse.json({ deleted: true }))
    )
    const result = await api.delete<{ deleted: boolean }>('items/1')
    expect(result).toEqual({ deleted: true })
  })
})

describe('request interceptor — auth', () => {
  it('given a signed-in MSAL account, when a GET is sent, then no Authorization header is attached', async () => {
    mockMsalInstance.getAllAccounts.mockReturnValue([
      { username: 'user@test.com' },
    ])
    mockMsalInstance.acquireTokenSilent.mockResolvedValue({
      accessToken: 'test-token',
    })

    let authHeader: string | null = null
    server.use(
      http.get(`${BASE}/catalog`, ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await api.get('catalog')
    expect(authHeader).toBeNull()
    expect(mockMsalInstance.acquireTokenSilent).not.toHaveBeenCalled()
  })

  it('given a signed-in MSAL account, when a POST is sent, then the Bearer token is attached', async () => {
    mockMsalInstance.getAllAccounts.mockReturnValue([
      { username: 'user@test.com' },
    ])
    mockMsalInstance.acquireTokenSilent.mockResolvedValue({
      accessToken: 'test-token',
    })

    let authHeader: string | null = null
    server.use(
      http.post(`${BASE}/protected`, ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await api.post('protected', { name: 'x' })
    expect(authHeader).toBe('Bearer test-token')
  })

  it('given no MSAL account, when a request is sent, then no Authorization header is attached', async () => {
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

  it('given token acquisition fails, when a POST is attempted, then it rejects instead of sending unauthenticated', async () => {
    mockMsalInstance.getAllAccounts.mockReturnValue([
      { username: 'user@test.com' },
    ])
    mockMsalInstance.acquireTokenSilent.mockRejectedValue(
      new Error('Token expired')
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const requestReachedServer = vi.fn()
    server.use(
      http.post(`${BASE}/protected`, () => {
        requestReachedServer()
        return HttpResponse.json({ ok: true })
      })
    )

    await expect(api.post('protected', { name: 'x' })).rejects.toThrow(
      'Token expired'
    )
    expect(requestReachedServer).not.toHaveBeenCalled()
  })

  it('given token acquisition would fail, when a GET is sent, then MSAL is not called and no Authorization header is attached', async () => {
    mockMsalInstance.getAllAccounts.mockReturnValue([
      { username: 'user@test.com' },
    ])
    mockMsalInstance.acquireTokenSilent.mockRejectedValue(
      new Error('Token expired')
    )

    let authHeader: string | null = null
    server.use(
      http.get(`${BASE}/fallback`, ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await api.get('fallback')
    expect(authHeader).toBeNull()
    expect(mockMsalInstance.acquireTokenSilent).not.toHaveBeenCalled()
  })
})

describe('response interceptor — error logging', () => {
  it('given a non-2xx response, when the request fails, then the API error details are logged', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(
      http.get(`${BASE}/fail`, () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 })
      )
    )

    await api.get('fail').catch(() => {})

    expect(consoleSpy).toHaveBeenCalledWith(
      '[bjjeire] API error:',
      expect.objectContaining({ status: 404 })
    )
  })
})
