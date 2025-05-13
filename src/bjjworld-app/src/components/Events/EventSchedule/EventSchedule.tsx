// src/components/Schedule/EventSchedule.tsx
import React from 'react';
import {
  BjjEventDto,
  ScheduleType,
  RecurringSchedule,
  FixedDateSchedule,
} from '../../../types/event';
import { EmptyScheduleMessage } from './EmptyScheduleMessage';
import { RecurringScheduleView } from './RecurringScheduleView';
import { FixedDateScheduleView } from './FixedDateScheduleView';
// Use specific icons for errors/warnings at this higher level
import { ExclamationTriangleIcon, CalendarIcon } from '@heroicons/react/20/solid';

interface EventScheduleProps {
  schedule: BjjEventDto['schedule'] | null | undefined;
  'data-testid'?: string;
}

export const EventSchedule: React.FC<EventScheduleProps> = ({
  schedule,
  'data-testid': baseTestId = 'event-schedule',
}) => {
  if (!schedule) {
    // This message now benefits from the improved EmptyScheduleMessage.
    // It's outside a ScheduleSection, so its own styling is what users see.
    // We can wrap it in a div to give it card-like padding if this is the top-level return for the schedule block
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <EmptyScheduleMessage
          message="No schedule information provided for this event."
          icon={<CalendarIcon className="h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500" />} // Neutral calendar icon
          data-testid={`${baseTestId}-no-schedule-provided`}
        />
      </div>
    );
  }

  switch (schedule.scheduleType) {
    case ScheduleType.Recurring:
      return (
        <RecurringScheduleView
          schedule={schedule as RecurringSchedule}
          data-testid={`${baseTestId}-recurring-view`}
        />
      );
    case ScheduleType.FixedDate:
      return (
        <FixedDateScheduleView
          schedule={schedule as FixedDateSchedule}
          data-testid={`${baseTestId}-fixed-date-view`}
        />
      );
    default: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unknownScheduleType = (schedule as any)?.scheduleType || 'unknown';
      // Similar wrapper for standalone error message
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/50">
          <EmptyScheduleMessage
            message={`Invalid or unsupported schedule type: ${unknownScheduleType}.`}
            icon={<ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400" />}
            data-testid={`${baseTestId}-invalid-schedule-type`}
          />
        </div>
      );
    }
  }
};