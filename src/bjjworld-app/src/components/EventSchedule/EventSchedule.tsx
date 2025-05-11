
import React from 'react'
import {BjjEventDto, ScheduleType, RecurringSchedule, FixedDateSchedule} from '../../types/event' 
import { EmptyScheduleMessage } from './EmptyScheduleMessage'
import { RecurringScheduleView } from './RecurringScheduleView'
import { FixedDateScheduleView } from './FixedDateScheduleView'

interface EventScheduleProps {
  schedule: BjjEventDto['schedule'] | null | undefined 
}

export const EventSchedule: React.FC<EventScheduleProps> = ({ schedule }) => {
  if (!schedule) {
    return <EmptyScheduleMessage message="No schedule information provided." />
  }

  switch (schedule.scheduleType) {
    case ScheduleType.Recurring:
      return <RecurringScheduleView schedule={schedule as RecurringSchedule} />
    case ScheduleType.FixedDate:
      return <FixedDateScheduleView schedule={schedule as FixedDateSchedule} />
    default:
      return (
        <EmptyScheduleMessage
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message={`Invalid or unsupported schedule type: ${(schedule as any).scheduleType}.`}
        />
      )
  }
}
