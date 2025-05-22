import React, { memo } from 'react'
import LoadingSpinner from './../spinner/loading-spinner';
import { LoadingStateTestIds } from '../../../constants/commonDataTestIds'

interface LoadingStateProps {
  message?: string
  'data-testid'?: string
  testIdInstanceSuffix?: string 
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  'data-testid': dataTestIdFromProp, 
  testIdInstanceSuffix = '',
}) => {
  const rootTestId =
    dataTestIdFromProp || LoadingStateTestIds.ROOT(testIdInstanceSuffix)

  return (
    <div
      className="flex w-full justify-center rounded-md bg-slate-50 p-10 shadow-sm dark:bg-slate-800"
      data-testid={rootTestId}
    >
      <LoadingSpinner
        color="text-emerald-600 dark:text-emerald-400"
        text={message}
        size="lg"
        data-testid={LoadingStateTestIds.SPINNER(testIdInstanceSuffix)}
        testIdInstanceSuffix={testIdInstanceSuffix}
      />
    </div>
  )
}

export default memo(LoadingState)
