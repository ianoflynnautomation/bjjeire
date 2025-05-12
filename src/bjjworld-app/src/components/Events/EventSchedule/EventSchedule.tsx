import React from 'react'
import {
  BjjEventDto,
  ScheduleType,
  RecurringSchedule,
  FixedDateSchedule,
} from '../../../types/event'
import { EmptyScheduleMessage } from './EmptyScheduleMessage'
import { RecurringScheduleView } from './RecurringScheduleView'
import { FixedDateScheduleView } from './FixedDateScheduleView'

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
      <EmptyScheduleMessage
        message="No schedule information provided."
        data-testid={`${baseTestId}-no-schedule-provided`}
      />
    )
  }

  switch (schedule.scheduleType) {
    case ScheduleType.Recurring:
      return (
        <RecurringScheduleView
          schedule={schedule as RecurringSchedule}
          data-testid={`${baseTestId}-recurring-view`}
        />
      )
    case ScheduleType.FixedDate:
      return (
        <FixedDateScheduleView
          schedule={schedule as FixedDateSchedule}
          data-testid={`${baseTestId}-fixed-date-view`}
        />
      )
    default: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unknownScheduleType = (schedule as any)?.scheduleType || 'unknown'
      return (
        <EmptyScheduleMessage
          message={`Invalid or unsupported schedule type: ${unknownScheduleType}.`}
          data-testid={`${baseTestId}-invalid-schedule-type`}
        />
      )
    }
  }
}
