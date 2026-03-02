import React from 'react'
import type { BjjEventScheduleDto } from '@/types/event'
import { formatDate } from '@/utils/dateUtils'
import {
  CalendarDaysIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ClockIcon as SolidClockIcon,
} from '@heroicons/react/20/solid'
import { ScheduleSection } from './ScheduleSection'
import { HoursList } from './HoursList'
import { EmptyScheduleMessage } from './EmptyScheduleMessage'

interface FixedDateScheduleViewProps {
  schedule: BjjEventScheduleDto
  'data-testid'?: string
}

export const FixedDateScheduleView: React.FC<FixedDateScheduleViewProps> = ({
  schedule,
  'data-testid': baseTestId = 'schedule-view',
}) => {
  const hasHours = schedule.hours && schedule.hours.length > 0

  if (schedule.startDate) {
    let dateString = formatDate(schedule.startDate)
    if (schedule.endDate && schedule.endDate !== schedule.startDate) {
      dateString += ` - ${formatDate(schedule.endDate)}`
    }

    return (
      <ScheduleSection
        title="Event Dates & Times"
        icon={<CalendarDaysIcon />}
        data-testid={baseTestId}
      >
        <p
          className="text-sm font-medium text-slate-700 dark:text-slate-200"
          data-testid={`${baseTestId}-dates`}
        >
          {dateString}
        </p>

        {hasHours ? (
          <div className="mt-1">
            <HoursList
              hours={schedule.hours}
              data-testid={`${baseTestId}-hours-list`}
            />
          </div>
        ) : (
          <EmptyScheduleMessage
            message="Timings not specified. Check event page for details."
            icon={
              <SolidClockIcon
                className="h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
            }
            data-testid={`${baseTestId}-no-timings-message`}
          />
        )}
      </ScheduleSection>
    )
  }

  // No fixed dates — render as recurring/weekly schedule
  return (
    <ScheduleSection
      title="Weekly Schedule"
      icon={<ClipboardDocumentListIcon />}
      data-testid={baseTestId}
    >
      {!hasHours ? (
        <EmptyScheduleMessage
          message="Schedule hours not yet specified."
          data-testid={`${baseTestId}-empty-hours-message`}
        />
      ) : (
        <HoursList
          hours={schedule.hours}
          data-testid={`${baseTestId}-hours-list`}
        />
      )}
      {schedule.endDate && (
        <div
          className="mt-2 flex items-center gap-x-1.5 pt-1 text-xs text-slate-500 dark:text-slate-400"
          data-testid={`${baseTestId}-end-date-info`}
        >
          <CalendarIcon
            className="h-3.5 w-3.5 flex-shrink-0"
            aria-hidden="true"
          />
          <span>Ends: {formatDate(schedule.endDate)}</span>
        </div>
      )}
    </ScheduleSection>
  )
}
