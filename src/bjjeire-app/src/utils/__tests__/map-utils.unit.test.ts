import { describe, it, expect } from 'vitest'
import { getGoogleMapsUrl } from '../map-utils'

const BASE = 'https://www.google.com/maps/search/?api=1&query='

describe('getGoogleMapsUrl', () => {
  it('given a null location, when the maps URL is built, then undefined is returned', () => {
    expect(getGoogleMapsUrl(null)).toBeUndefined()
  })

  it('given an undefined location, when the maps URL is built, then undefined is returned', () => {
    expect(getGoogleMapsUrl(undefined)).toBeUndefined()
  })

  it('given a location with no address or coordinates, when the maps URL is built, then undefined is returned', () => {
    expect(getGoogleMapsUrl({})).toBeUndefined()
  })

  it('given coordinates, when the maps URL is built, then the coordinates are used', () => {
    const url = getGoogleMapsUrl({
      coordinates: { latitude: 53.3498, longitude: -6.2603 },
    })
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=53.3498,-6.2603'
    )
  })

  it('given only an address, when the maps URL is built, then the address is used', () => {
    const url = getGoogleMapsUrl({ address: 'Griffith Ave, Dublin' })
    expect(url).toBe(`${BASE}${encodeURIComponent('Griffith Ave, Dublin')}`)
  })

  it('given a venue that differs from the address, when the maps URL is built, then the venue is appended', () => {
    const url = getGoogleMapsUrl({
      address: 'Griffith Ave, Dublin',
      venue: 'SBG Ireland',
    })
    expect(url).toBe(
      `${BASE}${encodeURIComponent('Griffith Ave, Dublin, SBG Ireland')}`
    )
  })

  it('given a venue that duplicates the address, when the maps URL is built, then the venue is omitted', () => {
    const url = getGoogleMapsUrl({
      address: 'Griffith Ave',
      venue: 'griffith ave',
    })
    expect(url).toBe(`${BASE}${encodeURIComponent('Griffith Ave')}`)
  })

  it('given a whitespace-only address, when the maps URL is built, then undefined is returned', () => {
    expect(getGoogleMapsUrl({ address: '   ' })).toBeUndefined()
  })

  it('given both coordinates and an address, when the maps URL is built, then the coordinates win', () => {
    const url = getGoogleMapsUrl({
      coordinates: { latitude: 51.9, longitude: -8.47 },
      address: 'Cork City',
    })
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=51.9,-8.47'
    )
  })
})
