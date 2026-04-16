import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useNavItems } from '../navigation/use-nav-items'
import { makeFeatureFlagWrapper } from '@/testing/render-utils'
import { paths } from '@/config/paths'

describe('useNavItems', () => {
  it('returns only About when all flags are disabled', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({
        BjjEvents: false,
        Gyms: false,
        Competitions: false,
        Stores: false,
      }),
    })

    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe('about')
  })

  it('returns Events and About when only BjjEvents is enabled', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({
        BjjEvents: true,
        Gyms: false,
        Competitions: false,
        Stores: false,
      }),
    })

    expect(result.current).toHaveLength(2)
    expect(result.current.map(i => i.id)).toEqual(['events', 'about'])
  })

  it('returns Gyms and About when only Gyms is enabled', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({
        BjjEvents: false,
        Gyms: true,
        Competitions: false,
        Stores: false,
      }),
    })

    expect(result.current).toHaveLength(2)
    expect(result.current.map(i => i.id)).toEqual(['gyms', 'about'])
  })

  it('returns Competitions and About when only Competitions is enabled', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({
        BjjEvents: false,
        Gyms: false,
        Competitions: true,
        Stores: false,
      }),
    })

    expect(result.current).toHaveLength(2)
    expect(result.current.map(i => i.id)).toEqual(['competitions', 'about'])
  })

  it('returns Stores and About when only Stores is enabled', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({
        BjjEvents: false,
        Gyms: false,
        Competitions: false,
        Stores: true,
      }),
    })

    expect(result.current).toHaveLength(2)
    expect(result.current.map(i => i.id)).toEqual(['stores', 'about'])
  })

  it('returns Events, Gyms, and About when BjjEvents and Gyms are enabled', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({
        BjjEvents: true,
        Gyms: true,
        Competitions: false,
        Stores: false,
      }),
    })

    expect(result.current).toHaveLength(3)
    expect(result.current.map(i => i.id)).toEqual(['events', 'gyms', 'about'])
  })

  it('returns all nav items when all flags are enabled', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({
        BjjEvents: true,
        Gyms: true,
        Competitions: true,
        Stores: true,
      }),
    })

    expect(result.current).toHaveLength(5)
    expect(result.current.map(i => i.id)).toEqual([
      'events',
      'gyms',
      'competitions',
      'stores',
      'about',
    ])
  })

  it('About is always the last item regardless of flags', () => {
    const { result: allOff } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({
        BjjEvents: false,
        Gyms: false,
        Competitions: false,
        Stores: false,
      }),
    })
    const { result: allOn } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({
        BjjEvents: true,
        Gyms: true,
        Competitions: true,
        Stores: true,
      }),
    })

    const last = (
      items: ReturnType<typeof useNavItems>
    ): ReturnType<typeof useNavItems>[number] => items[items.length - 1]
    expect(last(allOff.current).id).toBe('about')
    expect(last(allOn.current).id).toBe('about')
  })

  it('nav items have the correct hrefs', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({
        BjjEvents: true,
        Gyms: true,
        Competitions: true,
        Stores: true,
      }),
    })

    const itemMap = Object.fromEntries(result.current.map(i => [i.id, i]))
    expect(itemMap.events.to).toBe(paths.events.getHref())
    expect(itemMap.gyms.to).toBe(paths.gyms.getHref())
    expect(itemMap.competitions.to).toBe(paths.competitions.getHref())
    expect(itemMap.stores.to).toBe(paths.stores.getHref())
    expect(itemMap.about.to).toBe(paths.about.getHref())
  })

  it('nav items have the correct labels', () => {
    const { result } = renderHook(() => useNavItems(), {
      wrapper: makeFeatureFlagWrapper({
        BjjEvents: true,
        Gyms: true,
        Competitions: true,
        Stores: true,
      }),
    })

    const map = Object.fromEntries(result.current.map(i => [i.id, i]))
    expect(map.events.label).toBe(paths.events.label)
    expect(map.gyms.label).toBe(paths.gyms.label)
    expect(map.competitions.label).toBe(paths.competitions.label)
    expect(map.stores.label).toBe(paths.stores.label)
    expect(map.about.label).toBe(paths.about.label)
  })
})
