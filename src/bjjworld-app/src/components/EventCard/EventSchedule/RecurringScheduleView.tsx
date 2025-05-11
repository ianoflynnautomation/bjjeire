// src/components/EventSchedule/RecurringScheduleView.tsx
import React from 'react';
import { BjjEventDto, ScheduleType } from '../../../types/event';
import { formatDate } from '../../../utils/dateUtils';
import { ClipboardDocumentListIcon } from '@heroicons/react/20/solid';
import { ScheduleSection } from './ScheduleSection';
import { EmptyScheduleMessage } from './EmptyScheduleMessage';
import { HoursList } from './HoursList';

interface RecurringScheduleViewProps {
  schedule: Extract<BjjEventDto['schedule'], { scheduleType: ScheduleType.Recurring }>;
}

export const RecurringScheduleView: React.FC<RecurringScheduleViewProps> = ({ schedule }) => {
  if (!schedule.hours?.length) {
    return (
      <ScheduleSection title="Weekly Schedule" icon={<ClipboardDocumentListIcon />}>
        <div className="pl-7"> {/* Ensure alignment with icon */}
          <EmptyScheduleMessage message="Recurring schedule hours not specified." />
          {schedule.endDate && (
            <p className="mt-1.5 text-xs text-slate-500">
              Ends: {formatDate(schedule.endDate)}
            </p>
          )}
        </div>
      </ScheduleSection>
    );
  }

  return (
    <ScheduleSection title="Weekly Schedule" icon={<ClipboardDocumentListIcon />}>
      <HoursList hours={schedule.hours} scheduleType={ScheduleType.Recurring} />
      {schedule.endDate && (
        <p className="mt-1.5 pl-7 text-xs text-slate-500"> {/* Ensure alignment */}
          Ends: {formatDate(schedule.endDate)}
        </p>
      )}
    </ScheduleSection>
  );
};