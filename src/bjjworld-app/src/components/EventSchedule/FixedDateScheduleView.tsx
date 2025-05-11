// src/components/EventSchedule/FixedDateScheduleView.tsx
import React from 'react';
import { ScheduleType, FixedDateSchedule } from '../../types/event';
import { formatDate } from '../../utils/dateUtils';
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/20/solid';
import { ScheduleSection } from './ScheduleSection';
import { HoursList } from './HoursList';

interface FixedDateScheduleViewProps {
  schedule: FixedDateSchedule;
}

export const FixedDateScheduleView: React.FC<FixedDateScheduleViewProps> = ({ schedule }) => {
  return (
    <ScheduleSection title="Event Dates & Times" icon={<CalendarDaysIcon />}>
      <p className="text-slate-600 pl-7">
        {schedule.startDate ? formatDate(schedule.startDate) : 'Date TBD'}
        {/* Accessing schedule.endDate and schedule.hours should now be type-safe */}
        {schedule.endDate && schedule.endDate !== schedule.startDate
          ? ` - ${formatDate(schedule.endDate)}`
          : ''}
      </p>
      {schedule.hours && schedule.hours.length > 0 ? ( // Also check hours array is not empty
        <HoursList hours={schedule.hours} scheduleType={ScheduleType.FixedDate} />
      ) : (
        <div className="mt-1.5 flex items-center gap-x-2 text-xs text-slate-500 pl-7">
          <ClockIcon className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
          <span>Timings not specified. Check event page for details.</span>
        </div>
      )}
    </ScheduleSection>
  );
};