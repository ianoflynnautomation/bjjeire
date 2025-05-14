import React from 'react'
import LoadingSpinner from '../../LoadingSpinner' 

interface LoadingStateProps {
  message?: string
  'data-testid'?: string
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...', 
  'data-testid': baseTestId = 'loading-state'
}) => (
  <div
    className="flex w-full justify-center rounded-md bg-slate-50 p-10 shadow-sm dark:bg-slate-800"
    data-testid={baseTestId}
  >
    <LoadingSpinner
      color="text-emerald-600 dark:text-emerald-400" 
      text={message}
      size="lg"
      data-testid={`${baseTestId}-spinner`}
    />
  </div>
)

export default React.memo(LoadingState)