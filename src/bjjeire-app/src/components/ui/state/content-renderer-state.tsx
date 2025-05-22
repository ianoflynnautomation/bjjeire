import { ReactNode } from 'react'
import LoadingState from './loading-state'
import ErrorState from './error-state'
import NoDataState from './no-data-state'
import BackgroundFetchingIndicator from './updating-state'

interface ContentRendererProps<T> {
  isLoading: boolean
  isFetching?: boolean
  fetchError: Error | null | undefined
  formattedErrorMessage: string
  onRetry: () => void
  data: T[] | undefined
  renderDataComponent: (data: T[]) => ReactNode
  noDataTitle: string
  noDataMessageLine1: string
  noDataMessageLine2?: string
  showBackgroundFetchingIndicator?: boolean
  isInitialLoad: boolean
}

export function ContentRenderer<T>({
  isLoading,
  isFetching,
  fetchError,
  formattedErrorMessage,
  onRetry,
  data,
  renderDataComponent,
  noDataTitle,
  noDataMessageLine1,
  noDataMessageLine2,
  showBackgroundFetchingIndicator = true,
  isInitialLoad,
}: ContentRendererProps<T>) {
  const hasData = data && data.length > 0

  if (isInitialLoad && isLoading) {
    return <LoadingState />
  }

  if (fetchError && (!hasData || isInitialLoad)) {
    return <ErrorState message={formattedErrorMessage} onRetry={onRetry} />
  }

  if (!isLoading && !fetchError && !hasData && !isFetching) {
    return (
      <NoDataState
        title={noDataTitle}
        messageLine1={noDataMessageLine1}
        messageLine2={noDataMessageLine2}
      />
    )
  }

  if (hasData) {
    return (
      <>
        {isFetching && showBackgroundFetchingIndicator && !isInitialLoad && (
          <BackgroundFetchingIndicator />
        )}
        {renderDataComponent(data)}
      </>
    )
  }

  if (isLoading) return <LoadingState />

  return null
}
