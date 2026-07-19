import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventSchedule } from '../event-card/event-schedule'
import { ScheduleKind } from '@/types/event'
import type { BjjEventSessionDto } from '@/types/event'

const weeklySession = (day: string): BjjEventSessionDto => ({
  day,
  startTime: '10:00',
  endTime: '12:00',
})

describe('EventSchedule', () => {
  it.each([
    { schedule: null, case: 'null' },
    { schedule: undefined, case: 'undefined' },
  ])(
    'given a $case schedule, when the component renders, then nothing is shown',
    ({ schedule }) => {
      const { container } = render(<EventSchedule schedule={schedule} />)
      expect(container).toBeEmptyDOMElement()
    }
  )

  describe('Fixed dates', () => {
    it('given only a start date, when the schedule renders, then the formatted date is shown', () => {
      render(
        <EventSchedule
          schedule={{
            kind: ScheduleKind.FixedDates,
            startDate: '2026-04-01T10:00:00Z',
            sessions: [],
          }}
        />
      )
      expect(screen.getByText('April 1, 2026')).toBeInTheDocument()
    })

    it('given differing start and end dates, when the schedule renders, then a date range is shown', () => {
      render(
        <EventSchedule
          schedule={{
            kind: ScheduleKind.FixedDates,
            startDate: '2026-04-01T10:00:00Z',
            endDate: '2026-04-03T10:00:00Z',
            sessions: [],
          }}
        />
      )
      expect(
        screen.getByText('April 1, 2026 – April 3, 2026')
      ).toBeInTheDocument()
    })

    it('given equal start and end dates, when the schedule renders, then a single date is shown', () => {
      render(
        <EventSchedule
          schedule={{
            kind: ScheduleKind.FixedDates,
            startDate: '2026-04-01T10:00:00Z',
            endDate: '2026-04-01T10:00:00Z',
            sessions: [],
          }}
        />
      )
      expect(screen.getByText('April 1, 2026')).toBeInTheDocument()
      expect(screen.queryByText(/–/)).not.toBeInTheDocument()
    })

    it('given only an end date, when the schedule renders, then "Ends {date}" is shown', () => {
      render(
        <EventSchedule
          schedule={{
            kind: ScheduleKind.FixedDates,
            endDate: '2026-04-05T10:00:00Z',
            sessions: [],
          }}
        />
      )
      expect(screen.getByText('Ends April 5, 2026')).toBeInTheDocument()
    })

    it('given dated sessions with titles, when the schedule renders, then the date and title are shown', () => {
      render(
        <EventSchedule
          schedule={{
            kind: ScheduleKind.FixedDates,
            startDate: '2026-07-25T00:00:00Z',
            endDate: '2026-07-26T00:00:00Z',
            sessions: [
              {
                date: '2026-07-25T00:00:00Z',
                startTime: '10:00',
                endTime: '16:00',
                title: 'Day 1 — Gi',
              },
            ],
          }}
        />
      )
      expect(screen.getByText(/July 25, 2026: /)).toBeInTheDocument()
      expect(screen.getByText(/Day 1 — Gi/)).toBeInTheDocument()
    })
  })

  describe('Weekly sessions', () => {
    it('given three or fewer weekly sessions, when the schedule renders, then every session row is shown', () => {
      render(
        <EventSchedule
          schedule={{
            kind: ScheduleKind.WeeklyRecurring,
            sessions: [
              weeklySession('Monday'),
              weeklySession('Wednesday'),
              weeklySession('Friday'),
            ],
          }}
        />
      )
      expect(screen.getByText(/Monday/)).toBeInTheDocument()
      expect(screen.getByText(/Wednesday/)).toBeInTheDocument()
      expect(screen.getByText(/Friday/)).toBeInTheDocument()
      expect(screen.queryByText(/more/)).not.toBeInTheDocument()
    })

    it('given more than three sessions, when the schedule renders, then only three rows plus "+N more" are shown', () => {
      render(
        <EventSchedule
          schedule={{
            kind: ScheduleKind.WeeklyRecurring,
            sessions: [
              weeklySession('Monday'),
              weeklySession('Tuesday'),
              weeklySession('Wednesday'),
              weeklySession('Thursday'),
              weeklySession('Friday'),
            ],
          }}
        />
      )
      expect(screen.getByText('+2 more')).toBeInTheDocument()
      expect(screen.queryByText(/Thursday/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Friday/)).not.toBeInTheDocument()
    })

    it('given an empty sessions array, when the schedule renders, then no session rows or "more" text are shown', () => {
      const { container } = render(
        <EventSchedule
          schedule={{ kind: ScheduleKind.WeeklyRecurring, sessions: [] }}
        />
      )
      expect(screen.queryByText(/more/)).not.toBeInTheDocument()
      expect(
        container.querySelector('[data-testid^="sched-session"]')
      ).toBeNull()
    })
  })
})
