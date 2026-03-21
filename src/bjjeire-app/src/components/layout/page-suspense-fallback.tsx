import { memo } from 'react'
import LoadingSpinner from '@/components/ui/spinner/loading-spinner'

export const PageSuspenseFallback = memo(function PageSuspenseFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <LoadingSpinner
        size="lg"
        color="text-emerald-500 dark:text-emerald-300"
        text="Loading page..."
      />
    </div>
  )
})
