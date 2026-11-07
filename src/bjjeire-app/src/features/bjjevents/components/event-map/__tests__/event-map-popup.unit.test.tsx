import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { BjjEventDto } from '@/types/event'
import { BjjEventType, ScheduleKind } from '@/types/event'
import { createEvent } from '@/testing/factories/event.factory'
import { getGoogleMapsUrl } from '@/utils/map-utils'
import { EventMapTestIds } from '@/constants/eventDataTestIds'
import { toEventLocations, type EventLocation } from '../event-locations'
import { EventMapPopup } from '../event-map-popup'

function locationOf(...events: BjjEventDto[]): EventLocation {
  const location = toEventLocations(events).locations.at(0)
  if (!location) {
    throw new Error('no location')
  }
  return location
}

function seminar(overrides: Partial<BjjEventDto> = {}): BjjEventDto {
  return createEvent({
    name: 'Rebel County Submission Seminar',
    types: [BjjEventType.Seminar, BjjEventType.OpenMat],
    eventUrl: 'rebel.example.ie/seminar',
    location: {
      venue: 'Rebel County BJJ Academy',
      address: '5 Lapps Quay, Cork',
      coordinates: { type: 'Point', coordinates: [-8.468, 51.8998] },
    },
    schedule: {
      kind: ScheduleKind.FixedDates,
      startDate: '2026-07-10T09:00:00Z',
      endDate: '2026-07-12T17:00:00Z',
      sessions: [],
    },
    ...overrides,
  })
}

describe('EventMapPopup (AC-EVT-011)', () => {
  it('given an event, when the popup renders, then name, types, dates, venue, address and matching links are shown', () => {
    const event = seminar()
    render(<EventMapPopup location={locationOf(event)} onClose={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'Rebel County BJJ Academy' })
    ).toBeInTheDocument()
    expect(screen.getByText('5 Lapps Quay, Cork')).toBeInTheDocument()
    const entry = screen.getByTestId(EventMapTestIds.POPUP_EVENT)
    expect(
      within(entry).getByRole('heading', {
        name: 'Rebel County Submission Seminar',
      })
    ).toBeInTheDocument()
    expect(
      within(entry).getByTestId(EventMapTestIds.POPUP_EVENT_TYPES)
    ).toHaveTextContent('Seminar · Open Mat')
    expect(
      within(entry).getByTestId(EventMapTestIds.POPUP_EVENT_DATES)
    ).toHaveTextContent('10–12 July 2026')
    const eventLink = within(entry).getByRole('link', {
      name: /more information about rebel county/i,
    })
    expect(eventLink).toHaveAttribute(
      'href',
      'https://rebel.example.ie/seminar'
    )
    expect(eventLink).toHaveAttribute('target', '_blank')
    expect(eventLink).toHaveAttribute('rel', 'noopener noreferrer')
    const directions = screen.getByRole('link', {
      name: /directions to rebel county bjj academy/i,
    })
    expect(directions).toHaveAttribute('href', getGoogleMapsUrl(event.location))
    expect(directions).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it.each(['', '   ', 'javascript:alert(1)'])(
    'given event link %j, when the popup renders, then the event link is left out',
    eventUrl => {
      render(
        <EventMapPopup
          location={locationOf(seminar({ eventUrl }))}
          onClose={vi.fn()}
        />
      )

      expect(
        screen.queryByTestId(EventMapTestIds.POPUP_EVENT_LINK)
      ).not.toBeInTheDocument()
      expect(
        screen.getByTestId(EventMapTestIds.POPUP_DIRECTIONS_LINK)
      ).toBeInTheDocument()
    }
  )

  it('given a weekly event with no dates, when the popup renders, then its session days and times are shown as on the card', () => {
    const weekly = seminar({
      schedule: {
        kind: ScheduleKind.WeeklyRecurring,
        startDate: null,
        endDate: null,
        sessions: [
          { day: 'Saturday', startTime: '10:00', endTime: '12:00' },
          { day: 'Sunday', startTime: '11:00', endTime: '13:00' },
          { day: 'Monday', startTime: '19:00', endTime: '21:00' },
          { day: 'Wednesday', startTime: '19:00', endTime: '21:00' },
        ],
      },
    })
    render(<EventMapPopup location={locationOf(weekly)} onClose={vi.fn()} />)

    const dates = screen.getByTestId(EventMapTestIds.POPUP_EVENT_DATES)
    expect(dates).toHaveTextContent('Saturday: 10:00 AM–12:00 PM')
    expect(dates).toHaveTextContent('Monday: 7:00 PM–9:00 PM')
    expect(dates).not.toHaveTextContent('Wednesday')
    expect(dates).toHaveTextContent('+1 more')
  })

  it('given event text containing HTML, when the popup renders, then it is text and creates no elements', () => {
    const name = '<img src=x onerror="window.pwned=1"><b>Seminar</b>'
    const { container } = render(
      <EventMapPopup
        location={locationOf(seminar({ name }))}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name })).toHaveTextContent(name)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
  })
})

describe('EventMapPopup at a shared venue (AC-EVT-010)', () => {
  it('given two events at one venue, when the popup renders, then the venue shows once and both events are listed earliest first', () => {
    const later = seminar({
      name: 'Winter Solstice Open Mat',
      schedule: {
        kind: ScheduleKind.FixedDates,
        startDate: '2026-12-21',
        endDate: null,
        sessions: [],
      },
    })
    const earlier = seminar({
      name: 'Leinster Community Open Mat',
      schedule: {
        kind: ScheduleKind.FixedDates,
        startDate: '2026-11-15',
        endDate: null,
        sessions: [],
      },
    })
    render(
      <EventMapPopup location={locationOf(later, earlier)} onClose={vi.fn()} />
    )

    expect(
      screen.getByRole('group', { name: 'Rebel County BJJ Academy, 2 events' })
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('heading', { name: 'Rebel County BJJ Academy' })
    ).toHaveLength(1)
    expect(
      screen.getAllByTestId(EventMapTestIds.POPUP_DIRECTIONS_LINK)
    ).toHaveLength(1)
    expect(
      screen
        .getAllByTestId(EventMapTestIds.POPUP_EVENT_NAME)
        .map(heading => heading.textContent)
    ).toEqual(['Leinster Community Open Mat', 'Winter Solstice Open Mat'])
    expect(
      screen.queryByTestId(EventMapTestIds.POPUP_EVENT_VENUE)
    ).not.toBeInTheDocument()
  })

  it('given an event whose address differs at the same spot, when the popup renders, then that entry shows its own address', () => {
    const first = seminar({
      name: 'Earlier',
      schedule: {
        kind: ScheduleKind.FixedDates,
        startDate: '2026-10-01',
        endDate: null,
        sessions: [],
      },
    })
    const second = seminar({
      name: 'Later',
      schedule: {
        kind: ScheduleKind.FixedDates,
        startDate: '2026-11-01',
        endDate: null,
        sessions: [],
      },
      location: {
        ...first.location,
        address: 'Rear Hall, Lapps Quay, Cork',
      } as BjjEventDto['location'],
    })
    render(
      <EventMapPopup location={locationOf(first, second)} onClose={vi.fn()} />
    )

    const addresses = screen.getAllByTestId(EventMapTestIds.POPUP_EVENT_ADDRESS)
    expect(addresses).toHaveLength(1)
    expect(addresses[0]).toHaveTextContent('Rear Hall, Lapps Quay, Cork')
  })

  it('given an event whose venue text differs, when the popup renders, then that entry shows its own venue', () => {
    const first = seminar({
      name: 'Earlier',
      schedule: {
        kind: ScheduleKind.FixedDates,
        startDate: '2026-10-01',
        endDate: null,
        sessions: [],
      },
    })
    const second = seminar({
      name: 'Later',
      schedule: {
        kind: ScheduleKind.FixedDates,
        startDate: '2026-11-01',
        endDate: null,
        sessions: [],
      },
      location: {
        ...first.location,
        venue: 'Rebel County BJJ (Hall 2)',
      } as BjjEventDto['location'],
    })
    render(
      <EventMapPopup location={locationOf(first, second)} onClose={vi.fn()} />
    )

    const venues = screen.getAllByTestId(EventMapTestIds.POPUP_EVENT_VENUE)
    expect(venues).toHaveLength(1)
    expect(venues[0]).toHaveTextContent('Rebel County BJJ (Hall 2)')
  })
})

describe('EventMapPopup keyboard (AC-EVT-016)', () => {
  it('given an open popup, when it mounts, then focus moves into it so the links are next by keyboard', async () => {
    const user = userEvent.setup()
    render(<EventMapPopup location={locationOf(seminar())} onClose={vi.fn()} />)

    expect(screen.getByRole('group')).toHaveFocus()
    await user.tab()
    expect(
      screen.getByTestId(EventMapTestIds.POPUP_DIRECTIONS_LINK)
    ).toHaveFocus()
  })

  it('given an open popup, when Escape is pressed anywhere or close is used, then it asks to close', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Elsewhere</button>
        <EventMapPopup location={locationOf(seminar())} onClose={onClose} />
      </>
    )

    screen.getByRole('button', { name: 'Elsewhere' }).focus()
    await user.keyboard('{Escape}')
    await user.click(
      screen.getByRole('button', { name: /close event details/i })
    )

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
