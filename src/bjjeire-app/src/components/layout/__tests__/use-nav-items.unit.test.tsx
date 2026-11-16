import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useNavItems } from '../navigation/use-nav-items'
import { makeFeatureFlagWrapper } from '@/testing/render-utils'
import { paths } from '@/config/paths'
import { RETIRED_NAME_PATTERN } from '@/testing/retired-name'

const ALL_OFF = {
  BjjEvents: false,
  Gyms: false,
  Competitions: false,
  Stores: false,
  GymsMap: false,
  EventsMap: false,
  BjjEireCompetitions: false,
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

  // #5038, #3015: BJJ Éire competitions have no header entry of their own, whichever switches are on.
  it.each([
    { BjjEireCompetitions: false, Competitions: false },
    { BjjEireCompetitions: true, Competitions: false },
    { BjjEireCompetitions: false, Competitions: true },
    { BjjEireCompetitions: true, Competitions: true },
  ])(
    'given BjjEireCompetitions $BjjEireCompetitions and Competitions $Competitions, when the nav items are built, then no item carries the retired name and only the directory entry leads to /competitions',
    flags => {
      const items = renderNavItems({ ...flags, Gyms: true })

      for (const item of items) {
        expect(item.label).not.toMatch(RETIRED_NAME_PATTERN)
        expect(item.to).not.toMatch(RETIRED_NAME_PATTERN)
      }
      expect(items.map(i => i.id)).toEqual(
        flags.Competitions
          ? ['gyms', 'competitions', 'about']
          : ['gyms', 'about']
      )
    }
  )

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
