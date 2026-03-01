import React from 'react'
import { ScheduleType, RecurringSchedule } from '@/types/event'
import { formatDate } from '@/utils/dateUtils'
import {
  ClipboardDocumentListIcon,
  CalendarIcon,
} from '@heroicons/react/20/solid'
import { ScheduleSection } from './ScheduleSection'
import { EmptyScheduleMessage } from './EmptyScheduleMessage'
import { HoursList } from './HoursList'

interface RecurringScheduleViewProps {
  schedule: RecurringSchedule
  'data-testid'?: string
}

export const RecurringScheduleView: React.FC<RecurringScheduleViewProps> = ({
  schedule,
  'data-testid': baseTestId = 'recurring-schedule-view',
}) => {
  const hasHours = schedule.hours && schedule.hours.length > 0

  return (
    <ScheduleSection
      title="Weekly Schedule"
      icon={<ClipboardDocumentListIcon />}
      data-testid={baseTestId}
    >
      {!hasHours ? (
        <EmptyScheduleMessage
          message="Recurring schedule hours not yet specified."
          data-testid={`${baseTestId}-empty-hours-message`}
        />
      ) : (
        <HoursList
          hours={schedule.hours}
          scheduleType={ScheduleType.Recurring}
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
