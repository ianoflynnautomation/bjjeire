import { memo } from 'react'
import { BackgroundFetchingIndicatorTestIds } from '@/constants/commonDataTestIds'

interface BackgroundFetchingIndicatorProps {
  'data-testid'?: string
}

export default memo(function BackgroundFetchingIndicator({
  'data-testid': dataTestId = BackgroundFetchingIndicatorTestIds.ROOT,
}: BackgroundFetchingIndicatorProps) {
  return (
    <div
      className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 transform rounded-full bg-slate-800/90 px-3 py-1 text-xs font-semibold text-emerald-300 shadow-sm ring-1 ring-white/8 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      data-testid={dataTestId}
    >
      Updating...
    </div>
  )
})
