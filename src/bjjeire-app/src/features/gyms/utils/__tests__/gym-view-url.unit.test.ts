import { describe, expect, it } from 'vitest'
import { readGymView, withGymView } from '../gym-view-url'

describe('gym view URL state (AC-GYM-007)', () => {
  it('given view=map, when the view is read, then the map is chosen', () => {
    expect(readGymView(new URLSearchParams('view=map'))).toBe('map')
  })

  it.each(['', 'view=', 'view=satellite', 'view=MAP'])(
    'given "%s", when the view is read, then the list is chosen',
    query => {
      expect(readGymView(new URLSearchParams(query))).toBe('list')
    }
  )

  it('given a county, search and page, when switching to the map, then the county and search stay and the page goes', () => {
    const next = withGymView(
      new URLSearchParams('county=Cork&q=elite&page=3'),
      'map'
    )

    expect(next.get('view')).toBe('map')
    expect(next.get('county')).toBe('Cork')
    expect(next.get('q')).toBe('elite')
    expect(next.has('page')).toBe(false)
  })

  it('given the map with filters, when switching to the list, then the view is removed and the filters stay', () => {
    const next = withGymView(
      new URLSearchParams('county=Cork&view=map'),
      'list'
    )

    expect(next.toString()).toBe('county=Cork')
  })
})
