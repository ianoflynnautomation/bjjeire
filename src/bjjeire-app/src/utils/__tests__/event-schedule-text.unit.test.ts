import { describe, expect, it } from 'vitest'
import { ScheduleKind } from '@/types/event'
import { formatScheduleDates, formatSessionLine } from '../event-schedule-text'

// Shared by the event card and the map popup, so the two cannot drift (FR-010).
describe('event schedule text (#2011)', () => {
  it('given a start and end date, when formatted, then the range is shown as in Ireland', () => {
    expect(
      formatScheduleDates({
        kind: ScheduleKind.FixedDates,
        startDate: '2026-07-10T09:00:00Z',
        endDate: '2026-07-12T17:00:00Z',
        sessions: [],
      })
    ).toBe('10–12 July 2026')
  })

  it('given only an end date, when formatted, then it reads as an end date', () => {
    expect(
      formatScheduleDates({
        kind: ScheduleKind.WeeklyRecurring,
        startDate: null,
        endDate: '2026-12-20T00:00:00Z',
        sessions: [],
      })
    ).toBe('Ends 20 December 2026')
  })

  it.each([null, undefined])(
    'given schedule %s, when formatted, then nothing is shown',
    schedule => {
      expect(formatScheduleDates(schedule)).toBe('')
    }
  )

  it('given a weekly session with a title, when formatted, then day, times and title are shown', () => {
    expect(
      formatSessionLine({
        day: 'Saturday',
        startTime: '10:00',
        endTime: '12:00',
        title: 'Open mat',
      })
    ).toBe('Saturday: 10:00 AM–12:00 PM · Open mat')
  })
})
