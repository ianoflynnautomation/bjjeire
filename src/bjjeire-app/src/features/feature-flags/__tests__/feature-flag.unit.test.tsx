import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { FeatureFlag, useFeatureFlag } from '../index'
import { DEFAULT_FLAGS } from '../types'
import {
  renderWithProviders,
  makeFeatureFlagWrapper,
} from '@/testing/render-utils'

const ALL_FLAGS = Object.keys(DEFAULT_FLAGS) as (keyof typeof DEFAULT_FLAGS)[]

describe('DEFAULT_FLAGS', () => {
  it('given no configuration, when defaults are read, then every flag is fail-closed (false)', () => {
    for (const flag of ALL_FLAGS) {
      expect(DEFAULT_FLAGS[flag]).toBe(false)
    }
  })
})

describe('useFeatureFlag', () => {
  it.each(ALL_FLAGS)(
    'given no override, when the %s flag is read, then it is disabled',
    flag => {
      const { result } = renderHook(() => useFeatureFlag(flag), {
        wrapper: makeFeatureFlagWrapper({}),
      })
      expect(result.current).toBe(false)
    }
  )

  it.each(ALL_FLAGS)(
    'given an enabling override, when the %s flag is read, then it is enabled',
    flag => {
      const { result } = renderHook(() => useFeatureFlag(flag), {
        wrapper: makeFeatureFlagWrapper({ [flag]: true }),
      })
      expect(result.current).toBe(true)
    }
  )

  it('given a mix of enabled and disabled flags, when each flag is read, then each returns its own value', () => {
    const flags = {
      BjjEvents: true,
      Gyms: false,
      Competitions: true,
      Stores: false,
    }
    for (const flag of ALL_FLAGS) {
      const { result } = renderHook(() => useFeatureFlag(flag), {
        wrapper: makeFeatureFlagWrapper(flags),
      })
      expect(result.current).toBe(flags[flag])
    }
  })
})

describe('FeatureFlag component', () => {
  it('given an enabled flag, when the component renders, then the children are shown', () => {
    renderWithProviders(
      <FeatureFlag name="BjjEvents">
        <span>Events content</span>
      </FeatureFlag>,
      { featureFlags: { BjjEvents: true } }
    )
    expect(screen.getByText('Events content')).toBeInTheDocument()
  })

  it('given a disabled flag and no fallback, when the component renders, then nothing is shown', () => {
    renderWithProviders(
      <FeatureFlag name="BjjEvents">
        <span>Events content</span>
      </FeatureFlag>,
      { featureFlags: { BjjEvents: false } }
    )
    expect(screen.queryByText('Events content')).not.toBeInTheDocument()
  })

  it('given a disabled flag with a fallback, when the component renders, then only the fallback is shown', () => {
    renderWithProviders(
      <FeatureFlag name="BjjEvents" fallback={<span>Coming soon</span>}>
        <span>Events content</span>
      </FeatureFlag>,
      { featureFlags: { BjjEvents: false } }
    )
    expect(screen.queryByText('Events content')).not.toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('given an enabled flag with a fallback, when the component renders, then only the children are shown', () => {
    renderWithProviders(
      <FeatureFlag name="Gyms" fallback={<span>Coming soon</span>}>
        <span>Gyms content</span>
      </FeatureFlag>,
      { featureFlags: { Gyms: true } }
    )
    expect(screen.getByText('Gyms content')).toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
  })
})
