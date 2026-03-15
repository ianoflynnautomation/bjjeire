import type { ReactNode } from 'react'
import { Component } from 'react'
import ErrorState from './../ui/state/error-state'

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

  private readonly handleRetry = (): void => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          message={
            this.props.errorMessage ||
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
