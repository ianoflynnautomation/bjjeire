import { describe, it, expect } from 'vitest'
import { formatTime, formatDate } from '../dateUtils'

describe('formatTime', () => {
  it('formats AM time correctly', () => {
    expect(formatTime('09:30')).toBe('9:30 AM')
  })

  it('formats PM time correctly', () => {
    expect(formatTime('14:00')).toBe('2:00 PM')
  })

  it('formats midnight correctly', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
  })

  it('formats noon correctly', () => {
    expect(formatTime('12:00')).toBe('12:00 PM')
  })

  it('returns raw value when no colon separator', () => {
    expect(formatTime('invalid')).toBe('invalid')
  })

  it('returns empty string for empty input', () => {
    expect(formatTime('')).toBe('')
  })
})

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    expect(formatDate('2024-06-15')).toBe('June 15, 2024')
  })

  it('formats ISO datetime string (uses date part only)', () => {
    expect(formatDate('2024-01-01T00:00:00Z')).toBe('January 1, 2024')
  })

  it('returns raw string for a non-ISO value', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('')
  })
})
