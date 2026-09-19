import type { JSX } from 'react'
import LoadingSpinner from '@/components/ui/spinner/loading-spinner'
import { LoadingStateTestIds } from '@/constants/commonDataTestIds'

interface LoadingStateProps {
  message?: string
  'data-testid'?: string
}

const LoadingState = function LoadingState({
  message = 'Loading data...',
  'data-testid': dataTestIdFromProp,
}: LoadingStateProps): JSX.Element {
  const rootTestId = dataTestIdFromProp ?? LoadingStateTestIds.ROOT

  return (
    <div
      className="flex w-full justify-center rounded-xl bg-surface-solid p-10 shadow-card ring-1 ring-hairline"
      data-testid={rootTestId}
    >
      <LoadingSpinner
        color="text-primary-600 dark:text-primary-400"
        text={message}
        size="lg"
        data-testid={LoadingStateTestIds.ROOT}
      />
    </div>
  )
}

export default LoadingState
