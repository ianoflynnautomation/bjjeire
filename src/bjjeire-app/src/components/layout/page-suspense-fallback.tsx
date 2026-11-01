import type { JSX } from 'react'
import LoadingSpinner from '@/components/ui/spinner/loading-spinner'
import { uiContent } from '@/config/ui-content'

export function PageSuspenseFallback(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <LoadingSpinner
        size="lg"
        color="text-primary-500 dark:text-primary-300"
        text={uiContent.shared.loadingPage}
      />
    </div>
  )
}
