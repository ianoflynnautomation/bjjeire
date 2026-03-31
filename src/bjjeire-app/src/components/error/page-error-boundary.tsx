import type { ReactNode, ErrorInfo } from 'react'
import { Component } from 'react'
import { logger } from '@/lib/logger'
import ErrorState from '@/components/ui/state/error-state'

interface PageErrorBoundaryProps {
  children: ReactNode
  errorMessage?: string
}

interface PageErrorBoundaryState {
  hasError: boolean
}

class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  public state: PageErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(_: Error): PageErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Unhandled error caught by PageErrorBoundary', { error, info })
  }

  private readonly handleRetry = (): void => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          message={
            this.props.errorMessage ??
            'Something went wrong. Please try refreshing the page.'
          }
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

export default PageErrorBoundary
