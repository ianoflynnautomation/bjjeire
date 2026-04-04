import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useContext } from 'react'
import { FeatureFlagContext } from '../context/feature-flag-context'
import { DEFAULT_FLAGS } from '../types'
import { api } from '@/lib/api-client'
import { makeFeatureFlagWrapper } from '@/testing/render-utils'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn() },
}))

const mockedApiGet = vi.mocked(api.get)

describe('FeatureFlagProvider (integration)', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
  })

  it('uses DEFAULT_FLAGS before the API resolves', () => {
    mockedApiGet.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useContext(FeatureFlagContext), {
      wrapper: makeFeatureFlagWrapper(),
    })

    expect(result.current).toEqual(DEFAULT_FLAGS)
  })

  it('merges API response into context once the fetch resolves', async () => {
    mockedApiGet.mockResolvedValue({ BjjEvents: true, Gyms: true })

    const { result } = renderHook(() => useContext(FeatureFlagContext), {
      wrapper: makeFeatureFlagWrapper(),
    })

    await waitFor(() => {
      expect(result.current.BjjEvents).toBe(true)
    })
    expect(result.current.Gyms).toBe(true)
  })

  it('keeps DEFAULT_FLAGS when the API returns flags disabled', async () => {
    mockedApiGet.mockResolvedValue({ BjjEvents: false, Gyms: false })

    const { result } = renderHook(() => useContext(FeatureFlagContext), {
      wrapper: makeFeatureFlagWrapper(),
    })

    await waitFor(() => expect(mockedApiGet).toHaveBeenCalledTimes(1))
    expect(result.current).toEqual(DEFAULT_FLAGS)
  })

  it('falls back to DEFAULT_FLAGS when the API request fails', async () => {
    mockedApiGet.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useContext(FeatureFlagContext), {
      wrapper: makeFeatureFlagWrapper(),
    })

    await waitFor(() => expect(mockedApiGet).toHaveBeenCalledTimes(1))
    expect(result.current).toEqual(DEFAULT_FLAGS)
  })

  it('does not call the API when overrides are provided', () => {
    const { result } = renderHook(() => useContext(FeatureFlagContext), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: true }),
    })

    expect(mockedApiGet).not.toHaveBeenCalled()
    expect(result.current.BjjEvents).toBe(true)
  })

  it('merges partial overrides with DEFAULT_FLAGS', () => {
    const { result } = renderHook(() => useContext(FeatureFlagContext), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: true }),
    })

    expect(result.current.BjjEvents).toBe(true)
    expect(result.current.Gyms).toBe(false)
  })

  it('requests flags from the correct API endpoint', async () => {
    mockedApiGet.mockResolvedValue({ BjjEvents: true, Gyms: true })

    renderHook(() => useContext(FeatureFlagContext), {
      wrapper: makeFeatureFlagWrapper(),
    })

    await waitFor(() => expect(mockedApiGet).toHaveBeenCalledTimes(1))
    expect(mockedApiGet).toHaveBeenCalledWith('/api/featureflag')
  })
})
