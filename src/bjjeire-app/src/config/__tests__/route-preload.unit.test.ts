import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { firstFeature, secondFeature, about, warn } = vi.hoisted(() => ({
  firstFeature: vi.fn<() => Promise<void>>(),
  secondFeature: vi.fn<() => Promise<void>>(),
  about: vi.fn<() => Promise<void>>(),
  warn: vi.fn(),
}))

vi.mock('@/config/features', () => ({
  features: [
    { path: '/events', Component: { preload: firstFeature } },
    { path: '/gyms', Component: { preload: secondFeature } },
  ],
  AboutPage: { preload: about },
}))

vi.mock('@/lib/logger', () => ({ logger: { warn } }))

const { preloadRoute, ROUTE_PRELOAD_TIMEOUT_MS } =
  await import('@/config/route-preload')

beforeEach(() => {
  for (const preload of [firstFeature, secondFeature, about]) {
    preload.mockReset()
    preload.mockResolvedValue()
  }
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('preloadRoute', () => {
  it('given a feature path, when preloading, then only that route chunk is loaded', async () => {
    await preloadRoute('/gyms')

    expect(secondFeature).toHaveBeenCalledOnce()
    expect(firstFeature).not.toHaveBeenCalled()
  })

  it('given the home path, when preloading, then the default route chunk is loaded', async () => {
    await preloadRoute('/')

    expect(firstFeature).toHaveBeenCalledOnce()
  })

  it('given the about path, when preloading, then the about chunk is loaded', async () => {
    await preloadRoute('/about')

    expect(about).toHaveBeenCalledOnce()
  })

  it('given an unknown path, when preloading, then nothing is loaded and it resolves', async () => {
    await expect(preloadRoute('/nope')).resolves.toBeUndefined()

    expect(firstFeature).not.toHaveBeenCalled()
    expect(secondFeature).not.toHaveBeenCalled()
    expect(about).not.toHaveBeenCalled()
  })

  it('given a chunk that fails to load, when preloading, then it resolves so the app can still render', async () => {
    firstFeature.mockRejectedValue(new Error('chunk failed'))

    await expect(preloadRoute('/events')).resolves.toBeUndefined()

    expect(warn).toHaveBeenCalledOnce()
  })

  it('given a chunk that hangs, when the timeout passes, then it resolves so the shell is not held back', async () => {
    vi.useFakeTimers()
    firstFeature.mockReturnValue(new Promise<void>(() => {}))
    const settled = vi.fn()

    void preloadRoute('/events').then(settled)
    await vi.advanceTimersByTimeAsync(ROUTE_PRELOAD_TIMEOUT_MS - 1)
    expect(settled).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(settled).toHaveBeenCalledOnce()
  })
})
