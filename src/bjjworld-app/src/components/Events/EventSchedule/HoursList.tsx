
// src/components/Schedule/HoursList.tsx
import React from 'react';
import { BjjEventHoursDto, ScheduleType } from '../../../types/event';
import { formatTime, formatDate } from '../../../utils/dateUtils';
import { ScheduleItem } from './ScheduleItem';
import { DAYS_OF_WEEK } from './constants'; // Assuming this provides { 0: 'Sunday', 1: 'Monday', ... }
import { ClockIcon } from '@heroicons/react/20/solid'; // Added for visual cue per item

interface HoursListProps {
  hours: BjjEventHoursDto[];
  scheduleType: ScheduleType;
  'data-testid'?: string;
}

export const HoursList: React.FC<HoursListProps> = ({
  hours,
  scheduleType,
  'data-testid': dataTestId = 'hours-list',
}) => {
  if (!hours || hours.length === 0) {
    return null;
  }

  const MAX_VISIBLE_HOURS = 3;

  return (
    // Removed pl-7 from ul, as ScheduleSection now handles indentation for its children block
    // Added a slight negative margin to counteract the parent's padding if items need to visually align perfectly with text that doesn't have list markers.
    // Or, more simply, ensure ScheduleItem handles its alignment well.
    // For now, no pl-* on the ul itself.
    <ul className="list-none space-y-1 text-slate-700 dark:text-slate-300" data-testid={dataTestId}>
      {hours.slice(0, MAX_VISIBLE_HOURS).map((hour, index) => (
        <ScheduleItem
          key={`${scheduleType}-${hour.openTime}-${index}-${hour.dayOfWeek || hour.date}`}
          data-testid={`${dataTestId}-item-${index}`}
          // Add flex and icon for better visual structure per item
          className="flex items-center gap-x-1.5"
        >
          <ClockIcon className="h-4 w-4 flex-shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
          <span>
            {scheduleType === ScheduleType.Recurring &&
            hour.dayOfWeek !== null &&
            hour.dayOfWeek !== undefined
              ? <strong className="font-medium text-slate-800 dark:text-slate-100">{`${DAYS_OF_WEEK[hour.dayOfWeek] || 'N/A Day'}: `}</strong>
              : scheduleType === ScheduleType.FixedDate && hour.date
                ? <strong className="font-medium text-slate-800 dark:text-slate-100">{`${formatDate(hour.date)}: `}</strong>
                : scheduleType === ScheduleType.FixedDate // Implies "Daily" for the event's primary date(s)
                  ? <strong className="font-medium text-slate-800 dark:text-slate-100">Daily: </strong>
                  : ''}
            {formatTime(hour.openTime)} - {formatTime(hour.closeTime)}
          </span>
        </ScheduleItem>
      ))}
      {hours.length > MAX_VISIBLE_HOURS && (
        <ScheduleItem
          // pl-0 removed as the parent ul no longer has padding.
          // Indent this message to align with the text of items above (after their icon)
          className="pt-1 text-xs text-slate-500 dark:text-slate-400 italic pl-[calc(theme(spacing.4)_+_theme(spacing[1.5]))]" // pl-4 (icon) + pl-1.5 (gap) = pl-5.5
          data-testid={`${dataTestId}-more-sessions-message`}
        >
          ...and {hours.length - MAX_VISIBLE_HOURS} more session(s)
        </ScheduleItem>
      )}
    </ul>
  );
};