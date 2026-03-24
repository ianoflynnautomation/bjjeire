import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventSchedule } from '../event-card/event-schedule'

describe('EventSchedule Component', () => {
  it('renders nothing when schedule is null', () => {
    const { container } = render(<EventSchedule schedule={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when schedule is undefined', () => {
    const { container } = render(<EventSchedule schedule={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows formatted startDate when only startDate is provided', () => {
    render(
      <EventSchedule schedule={{ startDate: '2026-04-01T10:00:00Z', hours: [] }} />
    )
    expect(screen.getByText('April 1, 2026')).toBeInTheDocument()
  })

  it('shows date range when startDate and endDate differ', () => {
    render(
      <EventSchedule
        schedule={{
          startDate: '2026-04-01T10:00:00Z',
          endDate: '2026-04-03T10:00:00Z',
          hours: [],
        }}
      />
    )
    expect(
      screen.getByText('April 1, 2026 – April 3, 2026')
    ).toBeInTheDocument()
  })

  it('shows single date when startDate equals endDate', () => {
    render(
      <EventSchedule
        schedule={{
          startDate: '2026-04-01T10:00:00Z',
          endDate: '2026-04-01T10:00:00Z',
          hours: [],
        }}
      />
    )
    expect(screen.getByText('April 1, 2026')).toBeInTheDocument()
    expect(screen.queryByText(/–/)).not.toBeInTheDocument()
  })

  it('shows "Ends {date}" when only endDate is provided', () => {
    render(
      <EventSchedule schedule={{ endDate: '2026-04-05T10:00:00Z', hours: [] }} />
    )
    expect(screen.getByText('Ends April 5, 2026')).toBeInTheDocument()
  })

  it('renders up to 3 hour rows', () => {
    render(
      <EventSchedule
        schedule={{
          hours: [
            { day: 'Monday', openTime: '10:00', closeTime: '12:00' },
            { day: 'Wednesday', openTime: '18:00', closeTime: '20:00' },
            { day: 'Friday', openTime: '09:00', closeTime: '11:00' },
          ],
        }}
      />
    )
    expect(screen.getByText(/Monday/)).toBeInTheDocument()
    expect(screen.getByText(/Wednesday/)).toBeInTheDocument()
    expect(screen.getByText(/Friday/)).toBeInTheDocument()
    expect(screen.queryByText(/more/)).not.toBeInTheDocument()
  })

  it('shows "+N more" when more than 3 hours exist', () => {
    render(
      <EventSchedule
        data-testid="sched"
        schedule={{
          hours: [
            { day: 'Monday', openTime: '10:00', closeTime: '12:00' },
            { day: 'Tuesday', openTime: '10:00', closeTime: '12:00' },
            { day: 'Wednesday', openTime: '10:00', closeTime: '12:00' },
            { day: 'Thursday', openTime: '10:00', closeTime: '12:00' },
            { day: 'Friday', openTime: '10:00', closeTime: '12:00' },
          ],
        }}
      />
    )
    expect(screen.getByText('+2 more')).toBeInTheDocument()
    // Only first 3 days rendered
    expect(screen.queryByText(/Thursday/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Friday/)).not.toBeInTheDocument()
  })

  it('renders no hour rows and no "more" text when hours array is empty', () => {
    render(<EventSchedule schedule={{ hours: [] }} />)
    expect(screen.queryByText(/more/)).not.toBeInTheDocument()
    // No clock rows — container still mounts but is effectively empty
    const { container } = render(<EventSchedule schedule={{ hours: [] }} />)
    expect(container.querySelector('[data-testid^="sched-hour"]')).toBeNull()
  })
})
