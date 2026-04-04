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
})
