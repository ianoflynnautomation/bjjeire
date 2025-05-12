import React from 'react'
import { ScheduleType, RecurringSchedule } from '../../../types/event'
import { formatDate } from '../../../utils/dateUtils'
import { ClipboardDocumentListIcon } from '@heroicons/react/20/solid'
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
  if (!schedule.hours?.length) {
    return (
      <ScheduleSection
        title="Weekly Schedule"
        icon={<ClipboardDocumentListIcon className="text-orange-500 dark:text-orange-400" />}
        data-testid={baseTestId}
      >
        <div className="pl-7">
          <EmptyScheduleMessage
            message="Recurring schedule hours not specified."
            data-testid={`${baseTestId}-empty-hours-message`}
          />
          {schedule.endDate && (
            <p
              className="mt-1.5 text-xs text-slate-600 dark:text-slate-400"
              data-testid={`${baseTestId}-end-date`}
            >
              Ends: {formatDate(schedule.endDate)}
            </p>
          )}
        </div>
      </ScheduleSection>
    )
  }

  return (
    <ScheduleSection
      title="Weekly Schedule"
      icon={<ClipboardDocumentListIcon className="text-orange-500 dark:text-orange-400" />}
      data-testid={baseTestId}
    >
      <HoursList
        hours={schedule.hours}
        scheduleType={ScheduleType.Recurring}
        data-testid={`${baseTestId}-hours-list`}
      />
      {schedule.endDate && (
        <p
          className="mt-1.5 pl-7 text-xs text-slate-600"
          data-testid={`${baseTestId}-end-date`}
        >
          Ends: {formatDate(schedule.endDate)}
        </p>
      )}
    </ScheduleSection>
  )
}
