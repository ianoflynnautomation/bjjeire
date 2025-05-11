// src/components/EventSchedule/EventSchedule.tsx
import React from 'react';
// Import the specific schedule types along with BjjEventDto and ScheduleType
import {
  BjjEventDto,
  ScheduleType,
  RecurringSchedule, // Import the specific type
  FixedDateSchedule  // Import the specific type
} from '../../../types/event'; // Adjust path as needed

import { EmptyScheduleMessage } from './EmptyScheduleMessage';
import { RecurringScheduleView } from './RecurringScheduleView';
import { FixedDateScheduleView } from './FixedDateScheduleView';

interface EventScheduleProps {
  // BjjEventDto['schedule'] is now EventScheduleUnion (or EventScheduleUnion | null if defined that way)
  schedule: BjjEventDto['schedule'] | null | undefined; // Allowing null/undefined for safety from parent
}

export const EventSchedule: React.FC<EventScheduleProps> = ({ schedule }) => {
  if (!schedule) {
    return <EmptyScheduleMessage message="No schedule information provided." />;
  }

  switch (schedule.scheduleType) {
    case ScheduleType.Recurring:
      // 'schedule' is now correctly narrowed to RecurringSchedule by TypeScript's CFA.
      // We use 'as RecurringSchedule' for an explicit assertion that aligns with the child component's props.
      return <RecurringScheduleView schedule={schedule as RecurringSchedule} />;
    case ScheduleType.FixedDate:
      // 'schedule' is now correctly narrowed to FixedDateSchedule by TypeScript's CFA.
      return <FixedDateScheduleView schedule={schedule as FixedDateSchedule} />;
    default:
      // This block helps ensure all schedule types are handled.
      // If a new ScheduleType is added and not cased above, TypeScript will error at 'exhaustiveCheck'.

      return (
        <EmptyScheduleMessage
          // Accessing scheduleType from a 'never' type is problematic.
          // We cast schedule to 'any' here to safely access scheduleType for the error message,
          // as 'exhaustiveCheck' itself is of type 'never'.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message={`Invalid or unsupported schedule type: ${(schedule as any).scheduleType}.`}
        />
      ); 
  }
};