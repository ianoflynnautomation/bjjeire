import { format, parseISO, isValid } from 'date-fns'

export function formatTime(time: string): string {
  try {
    const [hours, minutes] = time.split(':')
    if (hours === undefined || minutes === undefined) {
      return time
    }
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
    const date = parseISO(dateString)
    if (!isValid(date)) {
      return dateString
    }
    return format(date, 'MMMM d, yyyy')
  } catch {
    return dateString
  }
}
