import { http, HttpResponse } from 'msw'
import {
  renderHook,
  waitFor,
  type RenderHookResult,
} from '@testing-library/react'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { useContext } from 'react'
import { FeatureFlagContext } from '../context/feature-flag-context'
import { DEFAULT_FLAGS } from '../types'
import type { FeatureFlagsMap } from '../types'
import { API_ROUTES } from '@/config/api-routes'
import { server } from '@/testing/msw/server'
import { makeFeatureFlagWrapper } from '@/testing/render-utils'

const API = `http://localhost${API_ROUTES.featureFlags}`

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

function renderProvider(
  overrides?: Parameters<typeof makeFeatureFlagWrapper>[0]
): RenderHookResult<FeatureFlagsMap, unknown> {
  return renderHook(() => useContext(FeatureFlagContext), {
    wrapper: makeFeatureFlagWrapper(overrides),
  })
}

describe('FeatureFlagProvider (integration)', () => {
  it('uses DEFAULT_FLAGS before the API resolves', () => {
    server.use(http.get(API, () => new Promise(() => {})))

    const { result } = renderProvider()

    expect(result.current).toEqual(DEFAULT_FLAGS)
  })

  it('merges API response into context once the fetch resolves', async () => {
    server.use(
      http.get(API, () => HttpResponse.json({ BjjEvents: true, Gyms: true }))
    )

    const { result } = renderProvider()

    await waitFor(() => {
      expect(result.current.BjjEvents).toBe(true)
    })
    expect(result.current.Gyms).toBe(true)
  })

  it('keeps DEFAULT_FLAGS when the API returns flags disabled', async () => {
    let called = 0
    server.use(
      http.get(API, () => {
        called++
        return HttpResponse.json({ BjjEvents: false, Gyms: false })
      })
    )

    const { result } = renderProvider()

    await waitFor(() => expect(called).toBe(1))
    expect(result.current).toEqual(DEFAULT_FLAGS)
  })

  it('falls back to DEFAULT_FLAGS when the API request fails', async () => {
    let called = 0
    server.use(
      http.get(API, () => {
        called++
        return HttpResponse.json(null, { status: 500 })
      })
    )

    const { result } = renderProvider()

    await waitFor(() => expect(called).toBe(1))
    expect(result.current).toEqual(DEFAULT_FLAGS)
  })

  it('does not call the API when overrides are provided', async () => {
    let called = 0
    server.use(
      http.get(API, () => {
        called++
        return HttpResponse.json({ BjjEvents: true })
      })
    )

    const { result } = renderProvider({ BjjEvents: true })

    await new Promise(r => setTimeout(r, 10))
    expect(called).toBe(0)
    expect(result.current.BjjEvents).toBe(true)
  })

  it('merges partial overrides with DEFAULT_FLAGS', () => {
    const { result } = renderProvider({ BjjEvents: true })

    expect(result.current.BjjEvents).toBe(true)
    expect(result.current.Gyms).toBe(false)
  })

  it('requests flags from the correct API endpoint', async () => {
    let requestedPath: string | null = null
    server.use(
      http.get(API, ({ request }) => {
        requestedPath = new URL(request.url).pathname
        return HttpResponse.json({ BjjEvents: true, Gyms: true })
      })
    )

    renderProvider()

    await waitFor(() => expect(requestedPath).toBe(API_ROUTES.featureFlags))
  })
})
