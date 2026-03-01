import React from 'react'
import { ScheduleType, FixedDateSchedule } from '@/types/event'
import { formatDate } from '@/utils/dateUtils'
import {
  CalendarDaysIcon,
  ClockIcon as SolidClockIcon,
} from '@heroicons/react/20/solid'
import { ScheduleSection } from './ScheduleSection'
import { HoursList } from './HoursList'
import { EmptyScheduleMessage } from './EmptyScheduleMessage'

interface FixedDateScheduleViewProps {
  schedule: FixedDateSchedule
  'data-testid'?: string
}

export const FixedDateScheduleView: React.FC<FixedDateScheduleViewProps> = ({
  schedule,
  'data-testid': baseTestId = 'fixed-date-schedule-view',
}) => {
  const hasHours = schedule.hours && schedule.hours.length > 0

  let dateString = 'Date to be announced'
  if (schedule.startDate) {
    dateString = formatDate(schedule.startDate)
    if (schedule.endDate && schedule.endDate !== schedule.startDate) {
      dateString += ` - ${formatDate(schedule.endDate)}`
    }
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
            scheduleType={ScheduleType.FixedDate}
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
