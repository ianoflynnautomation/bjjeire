import { memo } from 'react'
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

const ErrorState = memo(function ErrorState({
  message,
  title = 'Error Loading Data',
  onRetry,
  'data-testid': dataTestIdFromProp,
}: ErrorStateProps): JSX.Element {
  const rootTestId = dataTestIdFromProp ?? ErrorStateTestIds.ROOT

  return (
    <div
      role="alert"
      className="my-10 rounded-2xl border border-red-500/30 bg-white/80 p-6 text-center backdrop-blur-sm shadow-md shadow-black/10 ring-1 ring-black/8 dark:bg-slate-800/40 dark:shadow-black/20 dark:ring-white/8"
      data-testid={rootTestId}
    >
      <ExclamationTriangleIcon
        className="mx-auto h-12 w-12 text-red-400"
        aria-hidden="true"
        data-testid={ErrorStateTestIds.ICON}
      />
      <h3
        className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-50"
        data-testid={ErrorStateTestIds.TITLE}
      >
        {title}
      </h3>
      <p
        className="mt-1 text-sm text-slate-500 dark:text-slate-400"
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
})

export default ErrorState
