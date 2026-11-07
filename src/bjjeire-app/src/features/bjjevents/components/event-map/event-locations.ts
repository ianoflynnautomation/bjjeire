import type { BjjEventDto } from '@/types/event'
import { uiContent } from '@/config/ui-content'
import { readField, readString } from '@/utils/untrusted'

const { pin } = uiContent.events.map

/** Events this close share a pin: five decimal places is about one metre. */
const SHARED_LOCATION_DECIMALS = 5

/** One pin: every event at one spot, earliest start first. */
export interface EventLocation {
  key: string
  latitude: number
  longitude: number
  /** The earliest event's venue. Each event keeps its own venue text. */
  venue: string
  address: string
  events: BjjEventDto[]
}

interface EventLocationsResult {
  locations: EventLocation[]
  unmappedCount: number
}

function isCoordinate(value: unknown, limit: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Math.abs(value) <= limit
  )
}

/** Reads GeoJSON `[longitude, latitude]`. Returns undefined when a pin could not be placed truthfully. */
function readLatLng(
  event: BjjEventDto
): { latitude: number; longitude: number } | undefined {
  const point = readField(readField(event, 'location'), 'coordinates')
  const pair = readField(point, 'coordinates')
  if (!Array.isArray(pair) || pair.length !== 2) {
    return undefined
  }
  const [longitude, latitude] = pair as unknown[]
  if (!isCoordinate(longitude, 180) || !isCoordinate(latitude, 90)) {
    return undefined
  }
  // 0,0 is a missing value that has been defaulted, not an event in the Gulf of Guinea.
  if (longitude === 0 && latitude === 0) {
    return undefined
  }
  return { latitude, longitude }
}

/** Undated events (weekly, or dates not yet set) sort after dated ones. */
function startTime(event: BjjEventDto): number {
  const raw = readString(readField(readField(event, 'schedule'), 'startDate'))
  const time = raw ? Date.parse(raw) : Number.NaN
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

function byEarliestStart(a: BjjEventDto, b: BjjEventDto): number {
  const difference = startTime(a) - startTime(b)
  if (difference !== 0 && !Number.isNaN(difference)) {
    return difference
  }
  return readString(a.name).localeCompare(readString(b.name))
}

export function eventVenue(event: BjjEventDto): string {
  return readString(readField(readField(event, 'location'), 'venue')).trim()
}

function eventAddress(event: BjjEventDto): string {
  return readString(readField(readField(event, 'location'), 'address')).trim()
}

export function toEventLocations(events: BjjEventDto[]): EventLocationsResult {
  const groups = new Map<
    string,
    { latitude: number; longitude: number; events: BjjEventDto[] }
  >()
  let unmappedCount = 0
  for (const event of events) {
    const position = readLatLng(event)
    if (!position) {
      unmappedCount += 1
      continue
    }
    const key = `${position.latitude.toFixed(SHARED_LOCATION_DECIMALS)},${position.longitude.toFixed(SHARED_LOCATION_DECIMALS)}`
    const group = groups.get(key)
    if (group) {
      group.events.push(event)
    } else {
      groups.set(key, { ...position, events: [event] })
    }
  }

  // Every group starts with the event that created it, so it is never empty.
  const locations = [...groups.entries()].map(([key, group]) => {
    const sorted = [...group.events].sort(byEarliestStart)
    const [earliest] = sorted as [BjjEventDto, ...BjjEventDto[]]
    return {
      key,
      latitude: group.latitude,
      longitude: group.longitude,
      venue: eventVenue(earliest),
      address: eventAddress(earliest),
      events: sorted,
    }
  })
  return { locations, unmappedCount }
}

/**
 * The pin's accessible name: the venue, with the number of events when there is more than one.
 * Without a venue, the event's own name says more than an address.
 */
export function eventLocationName(location: EventLocation): string {
  // Never empty: a location exists because an event created it.
  const earliest = location.events[0]
  const place =
    location.venue ||
    readString(earliest.name) ||
    location.address ||
    pin.fallbackVenue
  return location.events.length > 1
    ? `${place}, ${location.events.length} ${pin.eventsSuffix}`
    : place
}
