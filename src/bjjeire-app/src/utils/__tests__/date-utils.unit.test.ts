import { describe, it, expect } from 'vitest'
import { formatTime, formatDate } from '../date-utils'

describe('formatTime', () => {
  it('given an AM time, when it is formatted, then the 12-hour AM form is returned', () => {
    expect(formatTime('09:30')).toBe('9:30 AM')
  })

  it('given a PM time, when it is formatted, then the 12-hour PM form is returned', () => {
    expect(formatTime('14:00')).toBe('2:00 PM')
  })

  it('given midnight, when it is formatted, then 12 AM is returned', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
  })

  it('given noon, when it is formatted, then 12 PM is returned', () => {
    expect(formatTime('12:00')).toBe('12:00 PM')
  })

  it('given a value without a colon, when it is formatted, then the raw value is returned', () => {
    expect(formatTime('invalid')).toBe('invalid')
  })

  it('given an empty time, when it is formatted, then an empty string is returned', () => {
    expect(formatTime('')).toBe('')
  })
})

describe('formatDate', () => {
  it('given a valid ISO date, when it is formatted, then the readable date is returned', () => {
    expect(formatDate('2024-06-15')).toBe('June 15, 2024')
  })

  it('given an ISO datetime, when it is formatted, then only the date part is used', () => {
    expect(formatDate('2024-01-01T00:00:00Z')).toBe('January 1, 2024')
  })

  it('given a non-ISO value, when it is formatted, then the raw string is returned', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('given an empty date, when it is formatted, then an empty string is returned', () => {
    expect(formatDate('')).toBe('')
  })
})
