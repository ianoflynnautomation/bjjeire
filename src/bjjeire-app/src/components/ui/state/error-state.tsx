import type { JSX } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { ErrorStateTestIds } from '@/constants/commonDataTestIds'
import { Button } from '@/components/ui/button/button'

interface ErrorStateProps {
  message: string
  title?: string
  onRetry: () => void
  'data-testid'?: string
}

const ErrorState = function ErrorState({
  message,
  title = 'Error Loading Data',
  onRetry,
  'data-testid': dataTestIdFromProp,
}: ErrorStateProps): JSX.Element {
  const rootTestId = dataTestIdFromProp ?? ErrorStateTestIds.ROOT

  return (
    <div
      role="alert"
      className="my-10 rounded-2xl border border-danger-500/30 bg-surface p-6 text-center backdrop-blur-sm shadow-md shadow-black/10 ring-1 ring-hairline dark:shadow-black/20"
      data-testid={rootTestId}
    >
      <ExclamationTriangleIcon
        className="mx-auto h-12 w-12 text-danger-400"
        aria-hidden="true"
        data-testid={ErrorStateTestIds.ICON}
      />
      <h3
        className="mt-3 text-lg font-bold text-fg"
        data-testid={ErrorStateTestIds.TITLE}
      >
        {title}
      </h3>
      <p
        className="mt-1 text-sm text-fg-subtle"
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

export default ErrorState
