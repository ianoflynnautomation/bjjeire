import React, { memo } from 'react'
import { BackgroundFetchingIndicatorTestIds } from '../../constants/commonDataTestIds'

interface BackgroundFetchingIndicatorProps {
  'data-testid'?: string
}

const BackgroundFetchingIndicator: React.FC<
  BackgroundFetchingIndicatorProps
> = ({
  'data-testid': dataTestId = BackgroundFetchingIndicatorTestIds.ROOT(),
}) => (
  <div
    className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 transform rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm dark:bg-emerald-700 dark:text-emerald-100"
    role="status"
    aria-live="polite"
    data-testid={dataTestId}
  >
    Updating...
  </div>
)

export default memo(BackgroundFetchingIndicator)
