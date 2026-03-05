import React, { memo } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { ErrorStateTestIds } from '@/constants/commonDataTestIds'
import { Button } from '@/components/ui/button/button'

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
  const rootTestId = dataTestIdFromProp || ErrorStateTestIds.ROOT

  return (
    <div
      role="alert"
      className="my-10 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center shadow-md ring-1 ring-amber-100/80"
      data-testid={rootTestId}
    >
      <ExclamationTriangleIcon
        className="mx-auto h-12 w-12 text-amber-600"
        aria-hidden="true"
        data-testid={ErrorStateTestIds.ICON}
      />
      <h3
        className="mt-3 text-lg font-bold text-amber-900"
        data-testid={ErrorStateTestIds.TITLE}
      >
        {title}
      </h3>
      <p
        className="mt-1 text-sm text-amber-800"
        data-testid={ErrorStateTestIds.MESSAGE_LINE1}
      >
        {message}
      </p>
      <Button
        onClick={onRetry}
        className="mt-6"
        data-testid={ErrorStateTestIds.BUTTON}
      >
        Retry
      </Button>
    </div>
  )
}

export default memo(ErrorState)
