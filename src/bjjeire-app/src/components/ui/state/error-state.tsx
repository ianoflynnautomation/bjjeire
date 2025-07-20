import React, { memo } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { StateTestIds } from '../../../constants/commonDataTestIds'

interface ErrorStateProps {
  message: string
  title?: string
  onRetry: () => void
  'data-testid'?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  title = 'Error Loading Data',
  onRetry,
  'data-testid': dataTestIdFromProp,
}) => {
  const rootTestId = dataTestIdFromProp || StateTestIds.ROOT

  return (
    <div
      role="alert"
      className="my-10 rounded-md border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-700/50 dark:bg-red-900/20"
      data-testid={rootTestId}
    >
      <ExclamationTriangleIcon
        className="mx-auto h-10 w-10 text-red-500 dark:text-red-400"
        aria-hidden="true"
        data-testid={StateTestIds.ICON}
      />
      <h3
        className="mt-3 text-lg font-semibold text-red-800 dark:text-red-200"
        data-testid={StateTestIds.TITLE}
      >
        {title}
      </h3>
      <p
        className="mt-1 text-sm text-red-700 dark:text-red-300"
        data-testid={StateTestIds.MESSAGE_LINE1}
      >
        {message}
      </p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700 dark:focus:ring-offset-red-50 dark:dark:focus:ring-offset-red-900/20"
        data-testid={StateTestIds.BUTTON}
      >
        Retry
      </button>
    </div>
  )
}

export default memo(ErrorState)