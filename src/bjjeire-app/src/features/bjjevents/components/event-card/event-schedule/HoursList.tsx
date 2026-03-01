// src/components/Schedule/HoursList.tsx
import React from 'react'
import { BjjEventHoursDto, ScheduleType } from '@/types/event'
import { formatTime, formatDate } from '@/utils/dateUtils'
import { ScheduleItem } from './ScheduleItem'
import { DAYS_OF_WEEK } from './constants'
import { ClockIcon } from '@heroicons/react/20/solid'

interface HoursListProps {
  hours: BjjEventHoursDto[]
  scheduleType: ScheduleType
  'data-testid'?: string
}

export const HoursList: React.FC<HoursListProps> = ({
  hours,
  scheduleType,
  'data-testid': dataTestId = 'hours-list',
}) => {
  if (!hours || hours.length === 0) {
    return null
  }

  const MAX_VISIBLE_HOURS = 3
  const moreSessionsIndent = 'pl-[calc(theme(spacing.4)_+_theme(spacing[1.5]))]'

  return (
    <ul
      className="list-none space-y-1 text-slate-700 dark:text-slate-300"
      data-testid={dataTestId}
    >
      {hours.slice(0, MAX_VISIBLE_HOURS).map((hour, index) => {
        const prefix =
          scheduleType === ScheduleType.Recurring &&
          hour.dayOfWeek !== null &&
          hour.dayOfWeek !== undefined
            ? `${DAYS_OF_WEEK[hour.dayOfWeek] || 'N/A Day'}: `
            : scheduleType === ScheduleType.FixedDate && hour.date
              ? `${formatDate(hour.date)}: `
              : scheduleType === ScheduleType.FixedDate
                ? 'Daily: '
                : ''

        return (
          <ScheduleItem
            key={`${scheduleType}-${hour.openTime}-${index}-${hour.dayOfWeek || hour.date}`}
            data-testid={`${dataTestId}-item-${index}`}
            className="flex items-start gap-x-1.5"
          >
            <ClockIcon
              className="h-4 w-4 mt-0.5 flex-shrink-0 text-sky-600 dark:text-sky-400"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-baseline gap-x-1 min-w-0">
              {prefix && (
                <strong className="font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                  {prefix}
                </strong>
              )}
              <span className="text-slate-700 dark:text-slate-300">
                {formatTime(hour.openTime)} - {formatTime(hour.closeTime)}
              </span>
            </div>
          </ScheduleItem>
        )
      })}
      {hours.length > MAX_VISIBLE_HOURS && (
        <ScheduleItem
          className={`pt-1 text-xs text-slate-500 dark:text-slate-400 italic ${moreSessionsIndent}`}
          data-testid={`${dataTestId}-more-sessions-message`}
        >
          ...and {hours.length - MAX_VISIBLE_HOURS} more session(s)
        </ScheduleItem>
      )}
    </ul>
  )
}
