import { describe, expect, it } from 'vitest'
import { computeMapBounds, IRELAND_BOUNDS } from '../event-map-bounds'

const dublin = { latitude: 53.33, longitude: -6.26 }
const galway = { latitude: 53.27, longitude: -9.05 }

describe('computeMapBounds (AC-EVT-012)', () => {
  it('given Ireland, when the bounds are read, then they contain both ends of the island', () => {
    expect(IRELAND_BOUNDS.south).toBeLessThan(51.45)
    expect(IRELAND_BOUNDS.north).toBeGreaterThan(55.38)
    expect(IRELAND_BOUNDS.west).toBeLessThan(-10.47)
    expect(IRELAND_BOUNDS.east).toBeGreaterThan(-5.43)
  })

  it('given no filters, when bounds are computed, then all of Ireland is shown', () => {
    expect(computeMapBounds([dublin, galway], false)).toEqual(IRELAND_BOUNDS)
  })

  it('given filters and no usable pins, when bounds are computed, then all of Ireland is shown', () => {
    expect(computeMapBounds([], true)).toEqual(IRELAND_BOUNDS)
  })

  it('given filters and several results, when bounds are computed, then they fit exactly those results', () => {
    expect(computeMapBounds([dublin, galway], true)).toEqual({
      south: 53.27,
      west: -9.05,
      north: 53.33,
      east: -6.26,
    })
  })

  it('given filters and one location, when bounds are computed, then they collapse to that location', () => {
    expect(computeMapBounds([dublin], true)).toEqual({
      south: 53.33,
      west: -6.26,
      north: 53.33,
      east: -6.26,
    })
  })
})
