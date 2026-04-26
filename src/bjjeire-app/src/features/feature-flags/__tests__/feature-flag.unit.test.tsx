import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { FeatureFlag, useFeatureFlag } from '../index'
import { DEFAULT_FLAGS } from '../types'
import {
  renderWithProviders,
  makeFeatureFlagWrapper,
} from '@/testing/render-utils'

describe('DEFAULT_FLAGS', () => {
  it('defaults BjjEvents to false (fail-closed)', () => {
    expect(DEFAULT_FLAGS.BjjEvents).toBe(false)
  })

  it('defaults Gyms to false (fail-closed)', () => {
    expect(DEFAULT_FLAGS.Gyms).toBe(false)
  })

  it('defaults Competitions to false (fail-closed)', () => {
    expect(DEFAULT_FLAGS.Competitions).toBe(false)
  })

  it('defaults Stores to false (fail-closed)', () => {
    expect(DEFAULT_FLAGS.Stores).toBe(false)
  })
})

describe('useFeatureFlag', () => {
  it('returns false for BjjEvents when no override is provided', () => {
    const { result } = renderHook(() => useFeatureFlag('BjjEvents'), {
      wrapper: makeFeatureFlagWrapper({}),
    })
    expect(result.current).toBe(false)
  })

  it('returns false for Gyms when no override is provided', () => {
    const { result } = renderHook(() => useFeatureFlag('Gyms'), {
      wrapper: makeFeatureFlagWrapper({}),
    })
    expect(result.current).toBe(false)
  })

  it('returns true for BjjEvents when override enables it', () => {
    const { result } = renderHook(() => useFeatureFlag('BjjEvents'), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: true }),
    })
    expect(result.current).toBe(true)
  })

  it('returns true for Gyms when override enables it', () => {
    const { result } = renderHook(() => useFeatureFlag('Gyms'), {
      wrapper: makeFeatureFlagWrapper({ Gyms: true }),
    })
    expect(result.current).toBe(true)
  })

  it('returns false for Competitions when no override is provided', () => {
    const { result } = renderHook(() => useFeatureFlag('Competitions'), {
      wrapper: makeFeatureFlagWrapper({}),
    })
    expect(result.current).toBe(false)
  })

  it('returns true for Competitions when override enables it', () => {
    const { result } = renderHook(() => useFeatureFlag('Competitions'), {
      wrapper: makeFeatureFlagWrapper({ Competitions: true }),
    })
    expect(result.current).toBe(true)
  })

  it('returns false for Stores when no override is provided', () => {
    const { result } = renderHook(() => useFeatureFlag('Stores'), {
      wrapper: makeFeatureFlagWrapper({}),
    })
    expect(result.current).toBe(false)
  })

  it('returns true for Stores when override enables it', () => {
    const { result } = renderHook(() => useFeatureFlag('Stores'), {
      wrapper: makeFeatureFlagWrapper({ Stores: true }),
    })
    expect(result.current).toBe(true)
  })

  it('returns the correct value for each flag independently', () => {
    const { result: eventsResult } = renderHook(
      () => useFeatureFlag('BjjEvents'),
      { wrapper: makeFeatureFlagWrapper({ BjjEvents: true, Gyms: false }) }
    )
    const { result: gymsResult } = renderHook(() => useFeatureFlag('Gyms'), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: true, Gyms: false }),
    })

    expect(eventsResult.current).toBe(true)
    expect(gymsResult.current).toBe(false)
  })

  it('returns correct values when all flags are set independently', () => {
    const flags = {
      BjjEvents: true,
      Gyms: false,
      Competitions: true,
      Stores: false,
    }
    const { result: compsResult } = renderHook(
      () => useFeatureFlag('Competitions'),
      { wrapper: makeFeatureFlagWrapper(flags) }
    )
    const { result: storesResult } = renderHook(
      () => useFeatureFlag('Stores'),
      { wrapper: makeFeatureFlagWrapper(flags) }
    )

    expect(compsResult.current).toBe(true)
    expect(storesResult.current).toBe(false)
  })
})

describe('FeatureFlag component', () => {
  it('renders children when the flag is enabled', () => {
    renderWithProviders(
      <FeatureFlag name="BjjEvents">
        <span>Events content</span>
      </FeatureFlag>,
      { featureFlags: { BjjEvents: true } }
    )
    expect(screen.getByText('Events content')).toBeInTheDocument()
  })

  it('renders nothing when the flag is disabled and no fallback is given', () => {
    renderWithProviders(
      <FeatureFlag name="BjjEvents">
        <span>Events content</span>
      </FeatureFlag>,
      { featureFlags: { BjjEvents: false } }
    )
    expect(screen.queryByText('Events content')).not.toBeInTheDocument()
  })

  it('renders the fallback when the flag is disabled', () => {
    renderWithProviders(
      <FeatureFlag name="BjjEvents" fallback={<span>Coming soon</span>}>
        <span>Events content</span>
      </FeatureFlag>,
      { featureFlags: { BjjEvents: false } }
    )
    expect(screen.queryByText('Events content')).not.toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('does not render the fallback when the flag is enabled', () => {
    renderWithProviders(
      <FeatureFlag name="Gyms" fallback={<span>Coming soon</span>}>
        <span>Gyms content</span>
      </FeatureFlag>,
      { featureFlags: { Gyms: true } }
    )
    expect(screen.getByText('Gyms content')).toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
  })

  it('renders Gyms children when Gyms flag is enabled', () => {
    renderWithProviders(
      <FeatureFlag name="Gyms">
        <span>Gyms content</span>
      </FeatureFlag>,
      { featureFlags: { Gyms: true } }
    )
    expect(screen.getByText('Gyms content')).toBeInTheDocument()
  })

  it('renders Competitions children when Competitions flag is enabled', () => {
    renderWithProviders(
      <FeatureFlag name="Competitions">
        <span>Competitions content</span>
      </FeatureFlag>,
      { featureFlags: { Competitions: true } }
    )
    expect(screen.getByText('Competitions content')).toBeInTheDocument()
  })

  it('hides Competitions children when Competitions flag is disabled', () => {
    renderWithProviders(
      <FeatureFlag name="Competitions">
        <span>Competitions content</span>
      </FeatureFlag>,
      { featureFlags: { Competitions: false } }
    )
    expect(screen.queryByText('Competitions content')).not.toBeInTheDocument()
  })

  it('renders Stores children when Stores flag is enabled', () => {
    renderWithProviders(
      <FeatureFlag name="Stores">
        <span>Stores content</span>
      </FeatureFlag>,
      { featureFlags: { Stores: true } }
    )
    expect(screen.getByText('Stores content')).toBeInTheDocument()
  })

  it('hides Stores children when Stores flag is disabled', () => {
    renderWithProviders(
      <FeatureFlag name="Stores">
        <span>Stores content</span>
      </FeatureFlag>,
      { featureFlags: { Stores: false } }
    )
    expect(screen.queryByText('Stores content')).not.toBeInTheDocument()
  })

  it('renders Stores fallback when Stores flag is disabled', () => {
    renderWithProviders(
      <FeatureFlag name="Stores" fallback={<span>Stores coming soon</span>}>
        <span>Stores content</span>
      </FeatureFlag>,
      { featureFlags: { Stores: false } }
    )
    expect(screen.queryByText('Stores content')).not.toBeInTheDocument()
    expect(screen.getByText('Stores coming soon')).toBeInTheDocument()
  })
})
