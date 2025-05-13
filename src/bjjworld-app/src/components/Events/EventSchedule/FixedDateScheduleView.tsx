// src/components/Schedule/FixedDateScheduleView.tsx
import React from 'react';
import { ScheduleType, FixedDateSchedule } from '../../../types/event';
import { formatDate } from '../../../utils/dateUtils';
import { CalendarDaysIcon, ClockIcon as SolidClockIcon } from '@heroicons/react/20/solid'; // Matched to v20
import { ScheduleSection } from './ScheduleSection';
import { HoursList } from './HoursList';
import { EmptyScheduleMessage } from './EmptyScheduleMessage'; // For consistency in "no timings"

interface FixedDateScheduleViewProps {
  schedule: FixedDateSchedule;
  'data-testid'?: string;
}

export const FixedDateScheduleView: React.FC<FixedDateScheduleViewProps> = ({
  schedule,
  'data-testid': baseTestId = 'fixed-date-schedule-view',
}) => {
  const hasHours = schedule.hours && schedule.hours.length > 0;

  let dateString = 'Date to be announced';
  if (schedule.startDate) {
    dateString = formatDate(schedule.startDate);
    if (schedule.endDate && schedule.endDate !== schedule.startDate) {
      dateString += ` - ${formatDate(schedule.endDate)}`;
    }
  }

  return (
    <ScheduleSection
      title="Event Dates & Times"
      icon={<CalendarDaysIcon />} // Pass component, color handled by ScheduleSection
      data-testid={baseTestId}
    >
      {/* Date Information - will be indented by pl-7 from ScheduleSection */}
      <p
        className="text-sm font-medium text-slate-700 dark:text-slate-200"
        data-testid={`${baseTestId}-dates`}
      >
        {dateString}
      </p>

      {/* Time Information / Fallback Message */}
      {hasHours ? (
        <div className="mt-1"> {/* Add a little space above the HoursList */}
          <HoursList
            hours={schedule.hours}
            scheduleType={ScheduleType.FixedDate}
            data-testid={`${baseTestId}-hours-list`}
          />
        </div>
      ) : (
        // Using EmptyScheduleMessage for consistency, or a custom div like before
        <EmptyScheduleMessage
            message="Timings not specified. Check event page for details."
            icon={<SolidClockIcon className="h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />}
            data-testid={`${baseTestId}-no-timings-message`}
        />
        // Original alternative:
        // <div
        //   className="mt-2 flex items-center gap-x-2 text-sm text-slate-500 dark:text-slate-400"
        //   data-testid={`${baseTestId}-no-timings-message`}
        // >
        //   <SolidClockIcon
        //     className="h-4 w-4 flex-shrink-0"
        //     aria-hidden="true"
        //   />
        //   <span>Timings not specified. Check event page for details.</span>
        // </div>
      )}
    </ScheduleSection>
  );
};