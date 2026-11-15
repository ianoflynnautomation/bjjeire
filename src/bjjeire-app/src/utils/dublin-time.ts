// Tournament days and registration windows are stated in Irish time, wherever
// the visitor or the organiser is. The API speaks UTC instants.

const TIME_ZONE = 'Europe/Dublin'

const displayFormatter = new Intl.DateTimeFormat('en-IE', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const wallClockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/u
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/u

function readParts(
  formatter: Intl.DateTimeFormat,
  date: Date
): Record<string, string> {
  const parts: Record<string, string> = {}
  for (const part of formatter.formatToParts(date)) {
    parts[part.type] = part.value
  }
  return parts
}

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) {
    return null
  }
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/** How far the Irish clock is ahead of UTC at an instant, in milliseconds. */
function offsetAt(instantMs: number): number {
  const wall = readParts(wallClockFormatter, new Date(instantMs))
  const asUtc = Date.UTC(
    Number(wall.year),
    Number(wall.month) - 1,
    Number(wall.day),
    Number(wall.hour),
    Number(wall.minute),
    Number(wall.second)
  )
  return asUtc - Math.floor(instantMs / 1000) * 1000
}

/** `1 June 2026, 10:00`, as the clock reads in Ireland. Empty for a missing or invalid instant. */
export function formatDublinDateTime(iso: string | null | undefined): string {
  const date = toDate(iso)
  if (!date) {
    return ''
  }
  const { day, month, year, hour, minute } = readParts(displayFormatter, date)
  return `${day} ${month} ${year}, ${hour}:${minute}`
}

/** Turns a `datetime-local` field value read on an Irish clock into a UTC instant. */
export function dublinLocalToIso(local: string): string | null {
  const match = LOCAL_DATE_TIME.exec(local)
  if (!match) {
    return null
  }
  const [, year, month, day, hour, minute] = match
  const guess = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  )
  // The offset is looked up twice so a time just after a clock change lands right.
  const firstPass = guess - offsetAt(guess)
  return new Date(guess - offsetAt(firstPass)).toISOString()
}

/** Turns a UTC instant into a `datetime-local` field value on an Irish clock. */
export function isoToDublinLocal(iso: string | null | undefined): string {
  const date = toDate(iso)
  if (!date) {
    return ''
  }
  const { year, month, day, hour, minute } = readParts(wallClockFormatter, date)
  return `${year}-${month}-${day}T${hour}:${minute}`
}

/** The instant a `YYYY-MM-DD` day ends in Ireland: the following midnight. */
export function endOfDublinDayIso(day: string): string | null {
  const match = LOCAL_DATE.exec(day)
  if (!match) {
    return null
  }
  const next = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1)
  )
  return dublinLocalToIso(`${next.toISOString().slice(0, 10)}T00:00`)
}
