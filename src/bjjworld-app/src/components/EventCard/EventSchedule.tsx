import React from 'react';
import { BjjEventDto, ScheduleType } from '../../types/event';
import { formatTime, formatDate } from '../../utils/dateUtils';

interface EventScheduleProps {
  schedule: BjjEventDto['schedule'];
}

export const EventSchedule: React.FC<EventScheduleProps> = ({ schedule }) => {
  if (!schedule) {
    return <p className="text-xs text-gray-500 italic mb-4">No schedule provided.</p>;
  }

  if (schedule.scheduleType === ScheduleType.Recurring) {
    if (!schedule.hours || schedule.hours.length === 0) {
      return <p className="text-xs text-gray-500 italic mb-4">No hours provided.</p>;
    }

    return (
      <div className="mb-4 text-sm">
        <p className="font-semibold text-gray-700 mb-1">Weekly Schedule:</p>
        <ul className="list-disc list-inside text-gray-600 space-y-0.5">
          {schedule.hours.slice(0, 3).map((hour, index) => (
            <li key={index}>
              <span className="font-medium">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][hour.dayOfWeek ?? 0]}:
              </span>{' '}
              {formatTime(hour.openTime)} - {formatTime(hour.closeTime)}
            </li>
          ))}
          {schedule.hours.length > 3 && <li className="text-xs">...and more</li>}
        </ul>
        {schedule.endDate && (
          <p className="text-xs text-gray-500 mt-1">
            Ends: {formatDate(schedule.endDate)}
          </p>
        )}
      </div>
    );
  }

  if (schedule.scheduleType === ScheduleType.FixedDate) {
    return (
      <div className="mb-4 text-sm">
        <p className="font-semibold text-gray-700 mb-1">Event Dates:</p>
        <p className="text-gray-600">
          {schedule.startDate ? formatDate(schedule.startDate) : 'N/A'} -{' '}
          {schedule.endDate ? formatDate(schedule.endDate) : 'N/A'}
        </p>
        {schedule.hours && schedule.hours.length > 0 ? (
          <ul className="list-disc list-inside text-gray-600 space-y-0.5 mt-1">
            {schedule.hours.slice(0, 3).map((hour, index) => (
              <li key={index}>
                {hour.date ? formatDate(hour.date) : 'Daily'}: {formatTime(hour.openTime)} -{' '}
                {formatTime(hour.closeTime)}
              </li>
            ))}
            {schedule.hours.length > 3 && <li className="text-xs">...and more</li>}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 mt-1">All-day event</p>
        )}
      </div>
    );
  }

  return <p className="text-xs text-gray-500 italic mb-4">Invalid schedule type.</p>;
};