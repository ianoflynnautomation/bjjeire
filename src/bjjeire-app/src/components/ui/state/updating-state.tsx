import type { JSX } from 'react'
import { BackgroundFetchingIndicatorTestIds } from '@/constants/commonDataTestIds'

interface BackgroundFetchingIndicatorProps {
  'data-testid'?: string
}

const BackgroundFetchingIndicator = function BackgroundFetchingIndicator({
  'data-testid': dataTestId = BackgroundFetchingIndicatorTestIds.ROOT,
}: BackgroundFetchingIndicatorProps): JSX.Element {
  return (
    <div
      className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 transform rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-600 shadow-sm ring-1 ring-black/8 backdrop-blur-sm dark:bg-slate-800/90 dark:text-primary-300 dark:ring-white/8"
      role="status"
      aria-live="polite"
      data-testid={dataTestId}
    >
      Updating...
    </div>
  )
}

export default BackgroundFetchingIndicator
