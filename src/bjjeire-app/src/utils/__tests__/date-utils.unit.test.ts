import { describe, it, expect } from 'vitest'
import { formatIrishDateRange, formatTime, formatDate } from '../date-utils'

describe('formatIrishDateRange', () => {
  it.each([
    [
      'one day',
      '2026-11-15T00:00:00Z',
      '2026-11-15T00:00:00Z',
      '15 November 2026',
    ],
    ['no end date', '2026-11-15T00:00:00Z', null, '15 November 2026'],
    [
      'days in one month',
      '2026-11-28T00:00:00Z',
      '2026-11-29T00:00:00Z',
      '28–29 November 2026',
    ],
    [
      'two months',
      '2026-06-30T00:00:00Z',
      '2026-07-01T00:00:00Z',
      '30 June – 1 July 2026',
    ],
    [
      'two years',
      '2026-12-31T00:00:00Z',
      '2027-01-01T00:00:00Z',
      '31 December 2026 – 1 January 2027',
    ],
    ['an invalid end date', '2026-11-15T00:00:00Z', 'x', '15 November 2026'],
  ])(
    'given %s, when it is formatted, then the range reads naturally',
    (_label, start, end, expected) => {
      expect(formatIrishDateRange(start, end)).toBe(expected)
    }
  )

  it('given a late-evening UTC time in Irish summer time, when it is formatted, then the Irish date is shown', () => {
    expect(formatIrishDateRange('2026-06-13T23:30:00Z')).toBe('14 June 2026')
  })

  it('given a missing or invalid start date, when it is formatted, then there is no date', () => {
    expect(formatIrishDateRange(undefined)).toBeNull()
    expect(formatIrishDateRange('not-a-date')).toBeNull()
  })
})

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
    expect(formatDate('2024-06-15')).toBe('15 June 2024')
  })

  it('given an ISO datetime, when it is formatted, then only the date part is used', () => {
    expect(formatDate('2024-01-01T00:00:00Z')).toBe('1 January 2024')
  })

  it('given a non-ISO value, when it is formatted, then the raw string is returned', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('given an empty date, when it is formatted, then an empty string is returned', () => {
    expect(formatDate('')).toBe('')
  })

  it('given a late-evening UTC time in Irish summer time, when it is formatted, then the Irish date is shown', () => {
    expect(formatDate('2026-06-13T23:30:00Z')).toBe('14 June 2026')
  })
})
