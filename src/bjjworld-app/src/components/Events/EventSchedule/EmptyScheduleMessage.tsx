// src/components/Schedule/EmptyScheduleMessage.tsx
import React from 'react'
import { InformationCircleIcon } from '@heroicons/react/20/solid'

interface EmptyScheduleMessageProps {
  message: string
  'data-testid'?: string
}

export const EmptyScheduleMessage: React.FC<EmptyScheduleMessageProps> = ({
  message,
  'data-testid': dataTestId = 'empty-schedule-message',
}) => (
  <div
    className="flex items-center gap-x-2 text-sm text-slate-600 dark:text-slate-400"
    data-testid={dataTestId}
  >
    <InformationCircleIcon
      className="h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500"
      aria-hidden="true"
    />
    <span data-testid={`${dataTestId}-text`}>{message}</span>
  </div>
)
