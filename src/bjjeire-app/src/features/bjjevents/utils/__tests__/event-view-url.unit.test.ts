import { describe, expect, it } from 'vitest'
import { readEventView, withEventView } from '../event-view-url'

describe('event view URL state (AC-EVT-007)', () => {
  it('given view=map, when the view is read, then the map is chosen', () => {
    expect(readEventView(new URLSearchParams('view=map'))).toBe('map')
  })

  it.each(['', 'view=', 'view=satellite', 'view=MAP'])(
    'given "%s", when the view is read, then the list is chosen',
    query => {
      expect(readEventView(new URLSearchParams(query))).toBe('list')
    }
  )

  it('given a county, search and page, when switching to the map, then the county, types and search stay and the page goes', () => {
    const next = withEventView(
      new URLSearchParams('county=Cork&types=Camp&q=elite&page=3'),
      'map'
    )

    expect(next.get('view')).toBe('map')
    expect(next.get('county')).toBe('Cork')
    expect(next.getAll('types')).toEqual(['Camp'])
    expect(next.get('q')).toBe('elite')
    expect(next.has('page')).toBe(false)
  })

  it('given the map with filters, when switching to the list, then the view is removed and the filters stay', () => {
    const next = withEventView(
      new URLSearchParams('county=Cork&view=map'),
      'list'
    )

    expect(next.toString()).toBe('county=Cork')
  })
})
