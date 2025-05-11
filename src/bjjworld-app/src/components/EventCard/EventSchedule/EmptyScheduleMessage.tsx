// src/components/EventSchedule/EmptyScheduleMessage.tsx
import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/20/solid';

interface EmptyScheduleMessageProps {
  message: string;
}

export const EmptyScheduleMessage: React.FC<EmptyScheduleMessageProps> = ({ message }) => (
  <div className="flex items-center gap-x-2 text-sm text-slate-600">
    <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true" />
    <span>{message}</span>
  </div>
);