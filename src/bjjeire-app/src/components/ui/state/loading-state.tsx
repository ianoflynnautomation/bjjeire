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
      className="flex w-full justify-center rounded-2xl bg-white/70 p-10 backdrop-blur-sm shadow-md shadow-black/10 ring-1 ring-black/8 dark:bg-slate-800/40 dark:shadow-black/20 dark:ring-white/8"
      data-testid={rootTestId}
    >
      <LoadingSpinner
        color="text-emerald-600 dark:text-emerald-400"
        text={message}
        size="lg"
        data-testid={LoadingStateTestIds.ROOT}
      />
    </div>
  )
}

export default LoadingState
