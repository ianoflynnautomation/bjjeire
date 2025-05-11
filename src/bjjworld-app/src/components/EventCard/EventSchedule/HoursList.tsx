// src/components/EventSchedule/HoursList.tsx
import React from 'react';
import { BjjEventHoursDto, ScheduleType } from '../../../types/event'; 
import { formatTime, formatDate } from '../../../utils/dateUtils';
import { ScheduleItem } from './ScheduleItem';
import { DAYS_OF_WEEK } from './constants';

interface HoursListProps {
  hours: BjjEventHoursDto[];
  scheduleType: ScheduleType;
}

export const HoursList: React.FC<HoursListProps> = ({ hours, scheduleType }) => {
  if (!hours || hours.length === 0) {
    return null; // Or a specific message/component if nothing should render
  }

  const MAX_VISIBLE_HOURS = 3;

  return (
    <ul className="mt-1 list-none space-y-0.5 pl-7"> {/* Aligned with icon/title */}
      {hours.slice(0, MAX_VISIBLE_HOURS).map((hour, index) => (
        <ScheduleItem key={`${scheduleType}-${hour.openTime}-${index}`}> {/* Improved key */}
          {scheduleType === ScheduleType.Recurring &&
          hour.dayOfWeek !== null &&
          hour.dayOfWeek !== undefined
            ? `${DAYS_OF_WEEK[hour.dayOfWeek] || 'N/A Day'}: `
            : scheduleType === ScheduleType.FixedDate && hour.date
              ? `${formatDate(hour.date)}: `
              : scheduleType === ScheduleType.FixedDate // For FixedDate without specific hour.date, implies daily for the event range
                ? 'Daily: ' // Or "Specific day: " if dates differ in the main text
                : ''}
          {formatTime(hour.openTime)} - {formatTime(hour.closeTime)}
        </ScheduleItem>
      ))}
      {hours.length > MAX_VISIBLE_HOURS && (
        <ScheduleItem className="pl-0 text-xs text-slate-500 italic">
          ...and {hours.length - MAX_VISIBLE_HOURS} more session(s)
        </ScheduleItem>
      )}
    </ul>
  );
};