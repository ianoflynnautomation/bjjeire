import type { BjjEventScheduleDto, BjjEventSessionDto } from '@/types/event'
import { uiContent } from '@/config/ui-content'
import {
  formatDate,
  formatIrishDateRange,
  formatTime,
} from '@/utils/date-utils'
import { readString } from '@/utils/untrusted'

const { schedule: scheduleContent } = uiContent.events

/** The date line for an event, as it falls in Ireland. Shared by the event card and the map popup. */
export function formatScheduleDates(
  schedule: BjjEventScheduleDto | null | undefined
): string {
  if (!schedule) {
    return ''
  }
  if (schedule.startDate) {
    return (
      formatIrishDateRange(schedule.startDate, schedule.endDate) ??
      formatDate(schedule.startDate)
    )
  }
  if (schedule.endDate) {
    return `${scheduleContent.endsPrefix} ${formatDate(schedule.endDate)}`
  }
  return ''
}

/** One session as "day or date: start–end · title". */
export function formatSessionLine(session: BjjEventSessionDto): string {
  const when = session.date ? formatDate(session.date) : readString(session.day)
  const times = `${formatTime(readString(session.startTime))}–${formatTime(readString(session.endTime))}`
  const base = when ? `${when}: ${times}` : times
  return session.title ? `${base} · ${session.title}` : base
}
