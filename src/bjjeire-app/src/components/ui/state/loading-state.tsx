import React, { memo } from 'react'
import LoadingSpinner from '@/components/ui/spinner/loading-spinner';
import { LoadingStateTestIds } from '@/constants/commonDataTestIds'

interface LoadingStateProps {
  message?: string
  'data-testid'?: string
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  'data-testid': dataTestIdFromProp
}) => {
  const rootTestId =
    dataTestIdFromProp || LoadingStateTestIds.ROOT

  return (
    <div
      className="flex w-full justify-center rounded-2xl bg-slate-800/40 p-10 backdrop-blur-sm shadow-md shadow-black/20 ring-1 ring-white/[0.08]"
      data-testid={rootTestId}
    >
      <LoadingSpinner
        color="text-emerald-400"
        text={message}
        size="lg"
        data-testid={LoadingStateTestIds.ROOT}
      />
    </div>
  )
}

export default memo(LoadingState)
