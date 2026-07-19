import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useNavItems } from '../navigation/use-nav-items'
import { makeFeatureFlagWrapper } from '@/testing/render-utils'
import { paths } from '@/config/paths'

const ALL_OFF = {
  BjjEvents: false,
  Gyms: false,
  Competitions: false,
  Stores: false,
}

function renderNavItems(
  flags: Partial<typeof ALL_OFF>
): ReturnType<typeof useNavItems> {
  const { result } = renderHook(() => useNavItems(), {
    wrapper: makeFeatureFlagWrapper({ ...ALL_OFF, ...flags }),
  })
  return result.current
}

describe('useNavItems', () => {
  it('given every feature flag is disabled, when the nav items are built, then only About remains', () => {
    const items = renderNavItems({})

    expect(items.map(i => i.id)).toEqual(['about'])
  })

  it.each([
    { flag: 'BjjEvents', expected: ['events', 'about'] },
    { flag: 'Gyms', expected: ['gyms', 'about'] },
    { flag: 'Competitions', expected: ['competitions', 'about'] },
    { flag: 'Stores', expected: ['stores', 'about'] },
  ] as const)(
    'given only the $flag flag is enabled, when the nav items are built, then its item appears before About',
    ({ flag, expected }) => {
      const items = renderNavItems({ [flag]: true })

      expect(items.map(i => i.id)).toEqual(expected)
    }
  )

  it('given every feature flag is enabled, when the nav items are built, then all items appear in order with About last', () => {
    const items = renderNavItems({
      BjjEvents: true,
      Gyms: true,
      Competitions: true,
      Stores: true,
    })

    expect(items.map(i => i.id)).toEqual([
      'events',
      'gyms',
      'competitions',
      'stores',
      'about',
    ])
  })

  it('given all nav items, when they are built, then each links to its route with the configured label', () => {
    const items = renderNavItems({
      BjjEvents: true,
      Gyms: true,
      Competitions: true,
      Stores: true,
    })

    const itemMap = Object.fromEntries(items.map(i => [i.id, i]))
    for (const id of [
      'events',
      'gyms',
      'competitions',
      'stores',
      'about',
    ] as const) {
      expect(itemMap[id].to).toBe(paths[id].getHref())
      expect(itemMap[id].label).toBe(paths[id].label)
    }
  })
})
