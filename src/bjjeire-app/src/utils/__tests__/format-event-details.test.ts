import { describe, it, expect } from 'vitest'
import {
  formatPricingDisplay,
  formatOrganiserDisplay,
} from '../format-event-details'
import { PricingType } from '@/types/event'

describe('formatPricingDisplay', () => {
  it('returns "Free" for Free pricing type regardless of total', () => {
    expect(
      formatPricingDisplay(
        { total: 0, unit: 'event', currency: 'EUR' },
        PricingType.Free
      )
    ).toBe('Free')
  })

  it('returns unavailable message when total is 0 and no pricing type', () => {
    expect(
      formatPricingDisplay(
        { total: 0, unit: 'event', currency: 'EUR' },
        undefined
      )
    ).toBe('Pricing details unavailable')
  })

  it('formats flat rate without unit suffix', () => {
    expect(
      formatPricingDisplay(
        { total: 100, unit: 'event', currency: 'EUR' },
        PricingType.FlatRate
      )
    ).toBe('EUR 100.00')
  })

  it('appends "per day" for PerDay pricing', () => {
    expect(
      formatPricingDisplay(
        { total: 150, unit: 'event', currency: 'EUR' },
        PricingType.PerDay
      )
    ).toBe('EUR 150.00 per day')
  })

  it('appends "per session" for PerSession pricing', () => {
    expect(
      formatPricingDisplay(
        { total: 60, unit: 'event', currency: 'EUR' },
        PricingType.PerSession
      )
    ).toBe('EUR 60.00 per session')
  })

  it('omits currency prefix when currency is empty', () => {
    expect(
      formatPricingDisplay(
        { total: 50, unit: 'event', currency: '' },
        PricingType.FlatRate
      )
    ).toBe('50.00')
  })
})

describe('formatOrganiserDisplay', () => {
  it('returns undefined when organiser is undefined', () => {
    expect(formatOrganiserDisplay(undefined)).toBeUndefined()
  })

  it('returns undefined when both name and website are absent', () => {
    expect(formatOrganiserDisplay({ name: '', website: '' })).toBeUndefined()
  })

  it('returns hostname without www when website is valid', () => {
    expect(
      formatOrganiserDisplay({
        name: 'Org',
        website: 'https://www.example.com',
      })
    ).toBe('example.com')
  })

  it('returns name when website is invalid URL', () => {
    expect(
      formatOrganiserDisplay({ name: 'My Org', website: 'not-a-url' })
    ).toBe('My Org')
  })

  it('falls back to website string when name is empty and URL is invalid', () => {
    expect(formatOrganiserDisplay({ name: '', website: 'not-a-url' })).toBe(
      'not-a-url'
    )
  })

  it('returns name when no website is provided', () => {
    expect(formatOrganiserDisplay({ name: 'Solo Org', website: '' })).toBe(
      'Solo Org'
    )
  })
})
