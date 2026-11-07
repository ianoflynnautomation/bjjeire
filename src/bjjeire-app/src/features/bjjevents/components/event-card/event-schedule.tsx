import type { JSX } from 'react'
import type { BjjEventDto } from '@/types/event'
import {
  formatScheduleDates,
  formatSessionLine,
} from '@/utils/event-schedule-text'
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/20/solid'
import { uiContent } from '@/config/ui-content'
import { EventCardTestIds } from '@/constants/eventDataTestIds'
import { asArray } from '@/utils/untrusted'

const { schedule: scheduleContent } = uiContent.events

const MAX_VISIBLE_SESSIONS = 3

interface EventScheduleProps {
  schedule: BjjEventDto['schedule'] | null | undefined
  'data-testid'?: string
}

export const EventSchedule = function EventSchedule({
  schedule,
  'data-testid': dataTestId = EventCardTestIds.SCHEDULE,
}: EventScheduleProps): JSX.Element | null {
  if (!schedule) {
    return null
  }

  const dateText = formatScheduleDates(schedule)

  const allSessions = asArray(schedule.sessions)
  const sessions = allSessions.slice(0, MAX_VISIBLE_SESSIONS)
  const extraCount = allSessions.length - sessions.length

  return (
    <div className="space-y-1.5" data-testid={dataTestId}>
      {dateText && (
        <div
          className="flex items-center gap-1.5"
          data-testid={EventCardTestIds.SCHEDULE_DATES}
        >
          <CalendarDaysIcon
            className="h-3.5 w-3.5 shrink-0 text-primary-500 dark:text-primary-400"
            aria-hidden="true"
          />
          <span>{dateText}</span>
        </div>
      )}
      {sessions.map((session, i) => (
        <div
          key={`${session.date ?? session.day}-${i}`}
          className="flex items-center gap-1.5"
          data-testid={`${EventCardTestIds.SCHEDULE_SESSION}-${i}`}
        >
          <ClockIcon
            className="h-3.5 w-3.5 shrink-0 text-primary-500 dark:text-primary-400"
            aria-hidden="true"
          />
          <span>{formatSessionLine(session)}</span>
        </div>
      ))}
      {extraCount > 0 && (
        <p
          className="pl-5 text-xs italic text-fg-subtle"
          data-testid={EventCardTestIds.SCHEDULE_MORE}
        >
          +{extraCount} {scheduleContent.moreHoursSuffix}
        </p>
      )}
    </div>
  )
}
