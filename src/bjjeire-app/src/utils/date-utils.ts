import { format, parseISO, isValid } from 'date-fns'

const irishDateFormatter = new Intl.DateTimeFormat('en-IE', {
  timeZone: 'Europe/Dublin',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

interface IrishDate {
  day: string
  month: string
  year: string
}

function readIrishDate(date: Date): IrishDate {
  const parts = irishDateFormatter.formatToParts(date)
  const part = (type: keyof IrishDate): string =>
    parts.find(candidate => candidate.type === type)?.value ?? ''
  return { day: part('day'), month: part('month'), year: part('year') }
}

/** Shows a date range as it falls in Ireland, wherever the visitor is. */
export function formatIrishDateRange(
  startDate?: string | null,
  endDate?: string | null
): string | null {
  const start = startDate ? new Date(startDate) : undefined
  if (!start || !isValid(start)) {
    return null
  }
  const from = readIrishDate(start)
  const fullFrom = `${from.day} ${from.month} ${from.year}`
  const end = endDate ? new Date(endDate) : undefined
  if (!end || !isValid(end)) {
    return fullFrom
  }
  const to = readIrishDate(end)
  const fullTo = `${to.day} ${to.month} ${to.year}`
  if (fullFrom === fullTo) {
    return fullFrom
  }
  if (from.year !== to.year) {
    return `${fullFrom} – ${fullTo}`
  }
  if (from.month !== to.month) {
    return `${from.day} ${from.month} – ${fullTo}`
  }
  return `${from.day}–${fullTo}`
}

export function formatTime(time: string): string {
  try {
    const parts = time.split(':')
    if (parts.length < 2) {
      return time
    }
    const [hours, minutes] = parts
    const date = new Date()
    date.setHours(Number(hours), Number(minutes))
    if (!isValid(date)) {
      return time
    }
    return format(date, 'h:mm a')
  } catch {
    return time
  }
}

export function formatDate(dateString: string): string {
  try {
    // parseISO only rejects non-ISO text: it reads a bare date as local time,
    // which would land on the wrong Irish day for visitors east of Ireland.
    if (!isValid(parseISO(dateString))) {
      return dateString
    }
    const { day, month, year } = readIrishDate(new Date(dateString))
    return `${day} ${month} ${year}`
  } catch {
    return dateString
  }
}
