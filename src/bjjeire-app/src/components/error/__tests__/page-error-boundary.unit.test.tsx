import type { JSX } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PageErrorBoundary from '../page-error-boundary'
import { logger } from '@/lib/logger'

function Bomb({ shouldThrow }: { shouldThrow: boolean }): JSX.Element {
  if (shouldThrow) {
    throw new Error('boom')
  }
  return <p>recovered content</p>
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('PageErrorBoundary', () => {
  it('given healthy children, when the boundary renders, then the children are shown with no alert', () => {
    render(
      <PageErrorBoundary>
        <p>happy content</p>
      </PageErrorBoundary>
    )

    expect(screen.getByText('happy content')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('given a child that throws, when the boundary catches it, then the default error alert is shown and the error is logged', () => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})

    render(
      <PageErrorBoundary>
        <Bomb shouldThrow />
      </PageErrorBoundary>
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try refreshing the page.'
    )
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    expect(loggerSpy).toHaveBeenCalledWith(
      'Unhandled error caught by PageErrorBoundary',
      expect.objectContaining({ error: expect.any(Error) })
    )
  })

  it('given a custom error message, when a child throws, then that message is shown in the alert', () => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})

    render(
      <PageErrorBoundary errorMessage="Gyms are unavailable right now.">
        <Bomb shouldThrow />
      </PageErrorBoundary>
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Gyms are unavailable right now.'
    )
  })
})
