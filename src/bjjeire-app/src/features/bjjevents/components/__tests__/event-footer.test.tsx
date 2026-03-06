import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventFooter } from '../event-card/event-footer'
import { ensureExternalUrlScheme } from '@/utils/formattingUtils'

describe('EventFooter Component', () => {
  const defaultProps = {
    eventName: 'Dublin Open Mat',
  }

  describe('When Event URL is Unavailable', () => {
    it.each([
      { eventUrl: undefined, case: 'undefined' },
      { eventUrl: '', case: 'an empty string' },
    ])(
      'should render a disabled button when eventUrl is $case',
      ({ eventUrl }) => {
        const { getByRole } = render(
          <EventFooter {...defaultProps} eventUrl={eventUrl} />
        )
        const expectedAriaLabel = `No information available for ${defaultProps.eventName}`
        const button = getByRole('button', { name: expectedAriaLabel })

        expect(button).toBeInTheDocument()
        expect(button).toBeDisabled()
        expect(button).toHaveAccessibleName(expectedAriaLabel)
        expect(button).toHaveTextContent('Information Unavailable')
      }
    )
  })

  describe('When Event URL is Available', () => {
    it('should render an active link with all correct attributes', () => {
      const eventUrl = 'https://grapplingireland.ie/events/open-mat'
      const { getByRole } = render(
        <EventFooter {...defaultProps} eventUrl={eventUrl} />
      )

      const expectedAriaLabel = `Get more information about ${defaultProps.eventName}`
      const link = getByRole('link', { name: expectedAriaLabel })

      expect(link).toBeInTheDocument()
      expect(link).not.toHaveAttribute('disabled')
      expect(link).toHaveAttribute('href', ensureExternalUrlScheme(eventUrl))
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveTextContent('More Information')
    })

    it('should add https scheme to URLs without a scheme', () => {
      const eventUrl = 'grapplingireland.ie/events/open-mat'
      const { getByRole } = render(
        <EventFooter {...defaultProps} eventUrl={eventUrl} />
      )
      const link = getByRole('link', {
        name: /get more information about/i,
      })
      expect(link).toHaveAttribute('href', `https://${eventUrl}`)
    })
  })

  describe('Edge Cases', () => {
    it('should use a fallback in the aria-label if eventName is empty', () => {
      const { getByRole } = render(
        <EventFooter eventName="" eventUrl={undefined} />
      )

      const expectedAriaLabel = 'No information available for this event'
      const button = getByRole('button', { name: expectedAriaLabel })

      expect(button).toBeInTheDocument()
    })
  })
})
