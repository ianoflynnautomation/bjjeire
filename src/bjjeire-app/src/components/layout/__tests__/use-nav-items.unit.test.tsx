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
  GymsMap: false,
  EventsMap: false,
  Tournaments: false,
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

  // #5038
  it('given the tournaments flag is disabled and every directory flag is enabled, when the nav items are built, then there is no tournament or account entry', () => {
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

  // #5038 (the other half): the entry appears only when the flag is on.
  it('given the tournaments flag is enabled, when the nav items are built, then Tournaments appears before About and links to the list', () => {
    const items = renderNavItems({ Gyms: true, Tournaments: true })

    expect(items.map(i => i.id)).toEqual(['gyms', 'tournaments', 'about'])
    expect(items[1].to).toBe(paths.tournaments.getHref())
    expect(items[1].label).toBe(paths.tournaments.label)
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
      GymsMap: false,
      EventsMap: false,
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
      GymsMap: false,
      EventsMap: false,
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
