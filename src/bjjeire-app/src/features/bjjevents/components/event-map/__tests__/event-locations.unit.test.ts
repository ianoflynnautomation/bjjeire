import { describe, expect, it } from 'vitest'
import type { BjjEventDto } from '@/types/event'
import { ScheduleKind } from '@/types/event'
import { createEvent } from '@/testing/factories/event.factory'
import { eventLocationName, toEventLocations } from '../event-locations'

function eventAt(
  name: string,
  coordinates: unknown,
  extra: { venue?: string; startDate?: string | null } = {}
): BjjEventDto {
  return createEvent({
    name,
    location: {
      address: `${name} Street`,
      venue: extra.venue ?? 'Leinster Grappling HQ',
      coordinates: { type: 'Point', coordinates },
    } as unknown as BjjEventDto['location'],
    schedule: {
      kind: ScheduleKind.FixedDates,
      startDate: extra.startDate === undefined ? '2026-08-01' : extra.startDate,
      endDate: null,
      sessions: [],
    },
  })
}

describe('toEventLocations (#2009)', () => {
  it('given GeoJSON [lng, lat], when converted, then latitude and longitude are not swapped', () => {
    const { locations } = toEventLocations([
      eventAt('Cork Seminar', [-8.468, 51.8998]),
    ])

    expect(locations).toHaveLength(1)
    expect(locations[0]?.latitude).toBe(51.8998)
    expect(locations[0]?.longitude).toBe(-8.468)
  })

  it.each([
    ['null', null],
    ['an empty pair', []],
    ['strings', ['-6.26', '53.33']],
    ['a latitude out of range', [-6.26, 95]],
    ['the 0,0 placeholder', [0, 0]],
  ])(
    'given %s, when converted, then the event has no pin and is counted',
    (_, value) => {
      const result = toEventLocations([eventAt('Nowhere Open Mat', value)])

      expect(result.locations).toEqual([])
      expect(result.unmappedCount).toBe(1)
    }
  )

  it('given an event with no location at all, when converted, then it is counted and does not throw', () => {
    const event = { ...createEvent(), location: undefined } as BjjEventDto

    expect(toEventLocations([event]).unmappedCount).toBe(1)
  })
})

describe('events at one venue (#2010)', () => {
  it('given two events at identical coordinates, when grouped, then they share one location, earliest start first', () => {
    const later = eventAt('Winter Solstice Open Mat', [-6.2889, 53.3382], {
      startDate: '2026-12-21',
    })
    const earlier = eventAt('Leinster Community Open Mat', [-6.2889, 53.3382], {
      startDate: '2026-11-15',
    })

    const { locations } = toEventLocations([later, earlier])

    expect(locations).toHaveLength(1)
    expect(locations[0]?.events.map(event => event.name)).toEqual([
      'Leinster Community Open Mat',
      'Winter Solstice Open Mat',
    ])
  })

  it('given coordinates that differ only past five decimal places, when grouped, then they share a location', () => {
    const { locations } = toEventLocations([
      eventAt('A', [-6.288901, 53.338201]),
      eventAt('B', [-6.288904, 53.338199]),
    ])

    expect(locations).toHaveLength(1)
  })

  it('given coordinates that differ at the fifth decimal place, when grouped, then each has its own location', () => {
    const { locations } = toEventLocations([
      eventAt('A', [-6.28891, 53.3382]),
      eventAt('B', [-6.28893, 53.3382]),
    ])

    expect(locations).toHaveLength(2)
  })

  it('given an event with no start date, when grouped, then it is listed after dated events', () => {
    const { locations } = toEventLocations([
      eventAt('Weekly Open Mat', [-6.2889, 53.3382], { startDate: null }),
      eventAt('Seminar', [-6.2889, 53.3382], { startDate: '2026-09-01' }),
    ])

    expect(locations[0]?.events.map(event => event.name)).toEqual([
      'Seminar',
      'Weekly Open Mat',
    ])
  })

  it("given a shared location, when named, then it uses the earliest event's venue and the count", () => {
    const { locations } = toEventLocations([
      eventAt('Later', [-6.2889, 53.3382], {
        venue: 'Leinster HQ (Hall 2)',
        startDate: '2026-12-01',
      }),
      eventAt('Earlier', [-6.2889, 53.3382], {
        venue: 'Leinster Grappling HQ',
        startDate: '2026-10-01',
      }),
    ])
    const location = locations.at(0)
    if (!location) {
      throw new Error('no location')
    }

    expect(location.venue).toBe('Leinster Grappling HQ')
    expect(eventLocationName(location)).toBe('Leinster Grappling HQ, 2 events')
  })

  it('given one event, when named, then it is the venue alone', () => {
    const location = toEventLocations([
      eventAt('Seminar', [-8.468, 51.8998], {
        venue: 'Rebel County BJJ Academy',
      }),
    ]).locations.at(0)
    if (!location) {
      throw new Error('no location')
    }

    expect(eventLocationName(location)).toBe('Rebel County BJJ Academy')
  })

  it('given no venue, when named, then it falls back to the event name', () => {
    const event = eventAt('Pop-up Open Mat', [-8.468, 51.8998])
    event.location = { ...event.location, venue: '' } as BjjEventDto['location']
    const location = toEventLocations([event]).locations.at(0)
    if (!location) {
      throw new Error('no location')
    }

    expect(eventLocationName(location)).toBe('Pop-up Open Mat')
  })
})
