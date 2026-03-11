import React from 'react'
import type { BjjEventDto } from '@/types/event'
import { formatDate, formatTime } from '@/utils/dateUtils'
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/20/solid'

interface EventScheduleProps {
  schedule: BjjEventDto['schedule'] | null | undefined
  'data-testid'?: string
}

export const EventSchedule: React.FC<EventScheduleProps> = ({
  schedule,
  'data-testid': dataTestId = 'event-schedule',
}) => {
  if (!schedule) {
    return null
  }

  let dateText = ''
  if (schedule.startDate) {
    dateText = formatDate(schedule.startDate)
    if (schedule.endDate && schedule.endDate !== schedule.startDate) {
      dateText += ` – ${formatDate(schedule.endDate)}`
    }
  } else if (schedule.endDate) {
    dateText = `Ends ${formatDate(schedule.endDate)}`
  }

  const hours = schedule.hours?.slice(0, 3) ?? []
  const extraCount = (schedule.hours?.length ?? 0) - hours.length

  return (
    <div className="space-y-1.5" data-testid={dataTestId}>
      {dateText && (
        <div
          className="flex items-center gap-1.5"
          data-testid={`${dataTestId}-dates`}
        >
          <CalendarDaysIcon
            className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400"
            aria-hidden="true"
          />
          <span>{dateText}</span>
        </div>
      )}
      {hours.map((hour, i) => (
        <div
          key={`${hour.day}-${i}`}
          className="flex items-center gap-1.5"
          data-testid={`${dataTestId}-hour-${i}`}
        >
          <ClockIcon
            className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400"
            aria-hidden="true"
          />
          <span>
            {hour.day}: {formatTime(hour.openTime)}–{formatTime(hour.closeTime)}
          </span>
        </div>
      ))}
      {extraCount > 0 && (
        <p
          className="pl-5 text-xs italic text-slate-500"
          data-testid={`${dataTestId}-more`}
        >
          +{extraCount} more
        </p>
      )}
    </div>
  )
}
