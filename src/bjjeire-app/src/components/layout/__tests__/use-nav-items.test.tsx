import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useNavItems } from '../navigation/use-nav-items'
import { makeFeatureFlagWrapper } from '@/testing/render-utils'
import { paths } from '@/config/paths'

describe('useNavItems', () => {
  it('returns only About when both flags are disabled', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: false, Gyms: false }),
    })

    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe('about')
  })

  it('returns Events and About when only BjjEvents is enabled', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: true, Gyms: false }),
    })

    expect(result.current).toHaveLength(2)
    expect(result.current.map(i => i.id)).toEqual(['events', 'about'])
  })

  it('returns Gyms and About when only Gyms is enabled', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: false, Gyms: true }),
    })

    expect(result.current).toHaveLength(2)
    expect(result.current.map(i => i.id)).toEqual(['gyms', 'about'])
  })

  it('returns Events, Gyms, and About when both flags are enabled', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: true, Gyms: true }),
    })

    expect(result.current).toHaveLength(3)
    expect(result.current.map(i => i.id)).toEqual(['events', 'gyms', 'about'])
  })

  it('About is always the last item regardless of flags', () => {
    const { result: bothOff } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: false, Gyms: false }),
    })
    const { result: bothOn } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: true, Gyms: true }),
    })

    const last = (
      items: ReturnType<typeof useNavItems>
    ): ReturnType<typeof useNavItems>[number] => items[items.length - 1]
    expect(last(bothOff.current).id).toBe('about')
    expect(last(bothOn.current).id).toBe('about')
  })

  it('nav items have the correct hrefs', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: true, Gyms: true }),
    })

    const itemMap = Object.fromEntries(result.current.map(i => [i.id, i]))
    expect(itemMap.events.to).toBe(paths.events.getHref())
    expect(itemMap.gyms.to).toBe(paths.gyms.getHref())
    expect(itemMap.about.to).toBe(paths.about.getHref())
  })

  it('nav items have the correct labels', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: true, Gyms: true }),
    })

    const itemMap = Object.fromEntries(result.current.map(i => [i.id, i]))
    expect(itemMap.events.label).toBe(paths.events.label)
    expect(itemMap.gyms.label).toBe(paths.gyms.label)
    expect(itemMap.about.label).toBe(paths.about.label)
  })
})
