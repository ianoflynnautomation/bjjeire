import React from 'react'
import type { BjjEventDto } from '@/types/event'
import { EmptyScheduleMessage } from './EmptyScheduleMessage'
import { FixedDateScheduleView } from './FixedDateScheduleView'
import { CalendarIcon } from '@heroicons/react/20/solid'

interface EventScheduleProps {
  schedule: BjjEventDto['schedule'] | null | undefined
  'data-testid'?: string
}

export const EventSchedule: React.FC<EventScheduleProps> = ({
  schedule,
  'data-testid': baseTestId = 'event-schedule',
}) => {
  if (!schedule) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <EmptyScheduleMessage
          message="No schedule information provided for this event."
          icon={
            <CalendarIcon className="h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
          }
          data-testid={`${baseTestId}-no-schedule-provided`}
        />
      </div>
    )
  }

  return (
    <FixedDateScheduleView
      schedule={schedule}
      data-testid={`${baseTestId}-view`}
    />
  )
}
