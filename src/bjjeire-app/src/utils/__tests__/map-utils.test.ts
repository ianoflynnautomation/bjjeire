import { describe, it, expect } from 'vitest'
import { getGoogleMapsUrl } from '../map-utils'

const BASE = 'https://www.google.com/maps/search/?api=1&query='

describe('getGoogleMapsUrl', () => {
  it('returns # for null location', () => {
    expect(getGoogleMapsUrl(null)).toBe('#')
  })

  it('returns # for undefined location', () => {
    expect(getGoogleMapsUrl(undefined)).toBe('#')
  })

  it('returns # when location has no address or coordinates', () => {
    expect(getGoogleMapsUrl({})).toBe('#')
  })

  it('uses coordinates when available', () => {
    const url = getGoogleMapsUrl({
      coordinates: { latitude: 53.3498, longitude: -6.2603 },
    })
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=53.3498,-6.2603'
    )
  })

  it('falls back to address when coordinates are absent', () => {
    const url = getGoogleMapsUrl({ address: 'Griffith Ave, Dublin' })
    expect(url).toBe(`${BASE}${encodeURIComponent('Griffith Ave, Dublin')}`)
  })

  it('appends venue to address when they differ', () => {
    const url = getGoogleMapsUrl({
      address: 'Griffith Ave, Dublin',
      venue: 'SBG Ireland',
    })
    expect(url).toBe(
      `${BASE}${encodeURIComponent('Griffith Ave, Dublin, SBG Ireland')}`
    )
  })

  it('omits venue when it duplicates the address (case-insensitive)', () => {
    const url = getGoogleMapsUrl({
      address: 'Griffith Ave',
      venue: 'griffith ave',
    })
    expect(url).toBe(`${BASE}${encodeURIComponent('Griffith Ave')}`)
  })

  it('returns # when address is only whitespace', () => {
    expect(getGoogleMapsUrl({ address: '   ' })).toBe('#')
  })

  it('prefers coordinates over address when both present', () => {
    const url = getGoogleMapsUrl({
      coordinates: { latitude: 51.9, longitude: -8.47 },
      address: 'Cork City',
    })
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=51.9,-8.47'
    )
  })
})
