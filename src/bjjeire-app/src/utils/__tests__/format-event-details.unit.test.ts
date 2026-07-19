import { describe, it, expect } from 'vitest'
import {
  formatPricingDisplay,
  formatOrganiserDisplay,
} from '../format-event-details'

describe('formatPricingDisplay', () => {
  it('given a free price, when the pricing is formatted, then "Free" is returned regardless of total', () => {
    expect(
      formatPricingDisplay({ total: 0, unit: 'free', currency: 'EUR' })
    ).toBe('Free')
  })

  it('given no price, when the pricing is formatted, then the unavailable message is returned', () => {
    expect(formatPricingDisplay(undefined)).toBe('Pricing details unavailable')
  })

  it('given a flat-rate price, when the pricing is formatted, then no unit suffix is appended', () => {
    expect(
      formatPricingDisplay({ total: 100, unit: 'event', currency: 'EUR' })
    ).toBe('EUR 100.00')
  })

  it('given a per-day price, when the pricing is formatted, then "per day" is appended', () => {
    expect(
      formatPricingDisplay({ total: 150, unit: 'perDay', currency: 'EUR' })
    ).toBe('EUR 150.00 per day')
  })

  it('given a per-session price, when the pricing is formatted, then "per session" is appended', () => {
    expect(
      formatPricingDisplay({ total: 60, unit: 'perSession', currency: 'EUR' })
    ).toBe('EUR 60.00 per session')
  })

  it('given a weekly calculated price, when the pricing is formatted, then "per week" is appended', () => {
    expect(
      formatPricingDisplay({ total: 60, unit: 'weekly', currency: 'EUR' })
    ).toBe('EUR 60.00 per week')
  })

  it('given a pricing option label, when the pricing is formatted, then the label is prefixed', () => {
    expect(
      formatPricingDisplay({
        label: 'Day pass',
        total: 110,
        unit: 'perDay',
        currency: 'EUR',
      })
    ).toBe('Day pass: EUR 110.00 per day')
  })

  it('given a labelled free price, when the pricing is formatted, then the label is prefixed', () => {
    expect(
      formatPricingDisplay({
        label: 'Spectators',
        total: 0,
        unit: 'free',
        currency: 'EUR',
      })
    ).toBe('Spectators: Free')
  })

  it('given an empty currency, when the pricing is formatted, then the currency prefix is omitted', () => {
    expect(
      formatPricingDisplay({ total: 50, unit: 'event', currency: '' })
    ).toBe('50.00')
  })
})

describe('formatOrganiserDisplay', () => {
  it('given an undefined organiser, when the display is formatted, then undefined is returned', () => {
    expect(formatOrganiserDisplay(undefined)).toBeUndefined()
  })

  it('given an organiser with no name or website, when the display is formatted, then undefined is returned', () => {
    expect(formatOrganiserDisplay({ name: '', website: '' })).toBeUndefined()
  })

  it('given a valid website, when the display is formatted, then the hostname without www is returned', () => {
    expect(
      formatOrganiserDisplay({
        name: 'Org',
        website: 'https://www.example.com',
      })
    ).toBe('example.com')
  })

  it('given a scheme-less website, when the display is formatted, then the hostname without www is returned', () => {
    expect(
      formatOrganiserDisplay({ name: 'Org', website: 'www.example.com' })
    ).toBe('example.com')
  })

  it('given a bare domain, when the display is formatted, then the hostname is returned', () => {
    expect(
      formatOrganiserDisplay({ name: '', website: 'example.com/team' })
    ).toBe('example.com')
  })

  it('given an invalid website URL, when the display is formatted, then the organiser name is returned', () => {
    expect(
      formatOrganiserDisplay({ name: 'My Org', website: 'not-a-url' })
    ).toBe('My Org')
  })

  it('given an empty name and invalid URL, when the display is formatted, then the raw website string is returned', () => {
    expect(formatOrganiserDisplay({ name: '', website: 'not-a-url' })).toBe(
      'not-a-url'
    )
  })

  it('given no website, when the display is formatted, then the organiser name is returned', () => {
    expect(formatOrganiserDisplay({ name: 'Solo Org', website: '' })).toBe(
      'Solo Org'
    )
  })
})
