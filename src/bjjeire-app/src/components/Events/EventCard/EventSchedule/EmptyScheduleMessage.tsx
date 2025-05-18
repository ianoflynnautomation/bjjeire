
import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/20/solid';

interface EmptyScheduleMessageProps {
  message: string;
  icon?: React.ReactNode;
  'data-testid'?: string;
}

export const EmptyScheduleMessage: React.FC<EmptyScheduleMessageProps> = ({
  message,
  icon = <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />, 
  'data-testid': dataTestId = 'empty-schedule-message',
}) => (
  <div
    className="flex items-center gap-x-2 text-sm text-slate-600 dark:text-slate-400"
    data-testid={dataTestId}
  >
    {icon}
    <span data-testid={dataTestId ? `${dataTestId}-text` : undefined}>{message}</span>
  </div>
);