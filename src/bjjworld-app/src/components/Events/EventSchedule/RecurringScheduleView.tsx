// src/components/Schedule/RecurringScheduleView.tsx
import React from 'react';
import { ScheduleType, RecurringSchedule } from '../../../types/event';
import { formatDate } from '../../../utils/dateUtils';
import { ClipboardDocumentListIcon, CalendarIcon } from '@heroicons/react/20/solid'; // Matched to v20
import { ScheduleSection } from './ScheduleSection';
import { EmptyScheduleMessage } from './EmptyScheduleMessage';
import { HoursList } from './HoursList';

interface RecurringScheduleViewProps {
  schedule: RecurringSchedule;
  'data-testid'?: string;
}

export const RecurringScheduleView: React.FC<RecurringScheduleViewProps> = ({
  schedule,
  'data-testid': baseTestId = 'recurring-schedule-view',
}) => {
  const hasHours = schedule.hours && schedule.hours.length > 0;

  return (
    <ScheduleSection
      title="Weekly Schedule"
      icon={<ClipboardDocumentListIcon />} // Pass the component, color is handled by ScheduleSection
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
        // This text will also be indented by pl-7 from ScheduleSection's child wrapper
        <div className="mt-2 flex items-center gap-x-1.5 pt-1 text-xs text-slate-500 dark:text-slate-400"
             data-testid={`${baseTestId}-end-date-info`}>
          <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span>Ends: {formatDate(schedule.endDate)}</span>
        </div>
      )}
    </ScheduleSection>
  );
};