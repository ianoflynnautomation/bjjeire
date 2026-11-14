import { describe, it, expect } from 'vitest'
import {
  dublinLocalToIso,
  endOfDublinDayIso,
  formatDublinDateTime,
  isoToDublinLocal,
} from '../dublin-time'

describe('dublin-time', () => {
  it('given a summer instant, when it is formatted, then it reads as Irish summer time', () => {
    expect(formatDublinDateTime('2026-06-01T09:00:00Z')).toBe(
      '1 June 2026, 10:00'
    )
  })

  it('given a winter instant, when it is formatted, then it reads as GMT', () => {
    expect(formatDublinDateTime('2026-01-15T09:05:00Z')).toBe(
      '15 January 2026, 09:05'
    )
  })

  it('given text that is not a date, when it is formatted, then an empty string is returned', () => {
    expect(formatDublinDateTime('not a date')).toBe('')
    expect(formatDublinDateTime(undefined)).toBe('')
  })

  it.each([
    ['2026-06-01T10:00', '2026-06-01T09:00:00.000Z'],
    ['2026-01-15T09:05', '2026-01-15T09:05:00.000Z'],
    // The hour after the clocks go forward on 29 March 2026.
    ['2026-03-29T02:30', '2026-03-29T01:30:00.000Z'],
    ['2026-10-25T12:00', '2026-10-25T12:00:00.000Z'],
  ])(
    'given %s on an Irish clock, when it is converted, then the instant is %s',
    (local, iso) => {
      expect(dublinLocalToIso(local)).toBe(iso)
    }
  )

  it('given an instant, when it is shown in a date-time field, then it is the Irish wall-clock time', () => {
    expect(isoToDublinLocal('2026-06-01T09:00:00Z')).toBe('2026-06-01T10:00')
    expect(isoToDublinLocal('2026-01-15T09:05:00Z')).toBe('2026-01-15T09:05')
  })

  it('given a value from a date-time field, when it goes to the API and back, then it is unchanged', () => {
    for (const local of ['2026-06-20T21:00', '2026-12-31T23:59']) {
      expect(isoToDublinLocal(dublinLocalToIso(local) ?? '')).toBe(local)
    }
  })

  it('given an incomplete field value, when it is converted, then nothing is returned', () => {
    expect(dublinLocalToIso('')).toBeNull()
    expect(dublinLocalToIso('2026-06-01')).toBeNull()
    expect(isoToDublinLocal('')).toBe('')
  })

  it('given a tournament day, when its end is worked out, then it is midnight Irish time after that day', () => {
    expect(endOfDublinDayIso('2026-06-27')).toBe('2026-06-27T23:00:00.000Z')
    expect(endOfDublinDayIso('2026-12-05')).toBe('2026-12-06T00:00:00.000Z')
    expect(endOfDublinDayIso('')).toBeNull()
  })
})
