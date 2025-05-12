// src/components/Schedule/FixedDateScheduleView.tsx
import React from 'react'
import { ScheduleType, FixedDateSchedule } from '../../../types/event'
import { formatDate } from '../../../utils/dateUtils'
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/20/solid'
import { ScheduleSection } from './ScheduleSection'
import { HoursList } from './HoursList'

interface FixedDateScheduleViewProps {
  schedule: FixedDateSchedule
  'data-testid'?: string
}

export const FixedDateScheduleView: React.FC<FixedDateScheduleViewProps> = ({
  schedule,
  'data-testid': baseTestId = 'fixed-date-schedule-view',
}) => {
  return (
    <ScheduleSection
      title="Event Dates & Times"
      icon={<CalendarDaysIcon className="text-orange-500 dark:text-orange-400" />}
      data-testid={baseTestId}
    >
      <p className="text-slate-700 pl-7" data-testid={`${baseTestId}-dates`}>
        {schedule.startDate ? formatDate(schedule.startDate) : 'Date TBD'}
        {schedule.endDate && schedule.endDate !== schedule.startDate
          ? ` - ${formatDate(schedule.endDate)}`
          : ''}
      </p>
      {schedule.hours && schedule.hours.length > 0 ? (
        <HoursList
          hours={schedule.hours}
          scheduleType={ScheduleType.FixedDate}
          data-testid={`${baseTestId}-hours-list`}
        />
      ) : (
        <div
          className="mt-1.5 flex items-center gap-x-2 text-xs text-slate-600 pl-7"
          data-testid={`${baseTestId}-no-timings-message`}
        >
          <ClockIcon
            className="h-4 w-4 flex-shrink-0 text-orange-500 dark:text-orange-400"
            aria-hidden="true"
          />
          <span>Timings not specified. Check event page for details.</span>
        </div>
      )}
    </ScheduleSection>
  )
}
