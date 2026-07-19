import { http, HttpResponse } from 'msw'
import { describe, it, expect, afterEach } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { server } from '@/testing/msw/server'
import { testApiUrl } from '@/testing/seed-helpers'
import { DEFAULT_FLAGS } from '../definitions'
import {
  loadFeatureFlags,
  resolveFlags,
  TEST_OVERRIDES_GLOBAL,
} from '../resolve'

const API = testApiUrl(API_ROUTES.featureFlags)

afterEach(() => {
  Reflect.deleteProperty(globalThis, TEST_OVERRIDES_GLOBAL)
})

describe('resolveFlags', () => {
  it('given no layers, when flags are resolved, then the fail-closed defaults are returned', () => {
    expect(resolveFlags([])).toEqual(DEFAULT_FLAGS)
  })

  it('given overlapping layers, when flags are resolved, then later layers win', () => {
    const result = resolveFlags([
      { Gyms: true, Stores: true },
      { Stores: false },
    ])
    expect(result.Gyms).toBe(true)
    expect(result.Stores).toBe(false)
  })

  it('given layers missing some flags, when flags are resolved, then absent flags keep their defaults', () => {
    const result = resolveFlags([{ Gyms: true }])
    expect(result.BjjEvents).toBe(DEFAULT_FLAGS.BjjEvents)
    expect(result.Competitions).toBe(DEFAULT_FLAGS.Competitions)
  })
})

describe('loadFeatureFlags', () => {
  it('given the API returns flags, when flags are loaded, then the response is merged into the defaults', async () => {
    server.use(
      http.get(API, () => HttpResponse.json({ BjjEvents: true, Gyms: true }))
    )
    const flags = await loadFeatureFlags()
    expect(flags.BjjEvents).toBe(true)
    expect(flags.Gyms).toBe(true)
    expect(flags.Stores).toBe(DEFAULT_FLAGS.Stores)
  })

  it('given the API request fails, when flags are loaded, then the fail-closed defaults are used', async () => {
    server.use(http.get(API, () => HttpResponse.json(null, { status: 500 })))
    const flags = await loadFeatureFlags()
    expect(flags).toEqual(DEFAULT_FLAGS)
  })

  it('given a test override global, when flags are loaded, then overrides win over the API and defaults', async () => {
    server.use(http.get(API, () => HttpResponse.json({ Gyms: false })))
    ;(globalThis as Record<string, unknown>)[TEST_OVERRIDES_GLOBAL] = {
      Gyms: true,
      Stores: true,
    }
    const flags = await loadFeatureFlags()
    expect(flags.Gyms).toBe(true)
    expect(flags.Stores).toBe(true)
  })

  it('given a stale backend with unknown keys, when flags are loaded, then the unknown keys are dropped', async () => {
    server.use(
      http.get(API, () => HttpResponse.json({ Gyms: true, RetiredFlag: true }))
    )
    const flags = await loadFeatureFlags()
    expect(flags.Gyms).toBe(true)
    expect((flags as Record<string, unknown>).RetiredFlag).toBeUndefined()
  })

  it('given a stale backend with non-boolean values, when flags are loaded, then those flags fall back to defaults', async () => {
    server.use(http.get(API, () => HttpResponse.json({ Gyms: 'yes' })))
    const flags = await loadFeatureFlags()
    expect(flags.Gyms).toBe(DEFAULT_FLAGS.Gyms)
  })
})
