import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventFooter } from '../event-card/event-footer'
import { ensureExternalUrlScheme } from '@/utils/formatting-utils'

describe('EventFooter', () => {
  const defaultProps = {
    eventName: 'Dublin Open Mat',
  }

  it.each([
    { eventUrl: undefined, case: 'undefined' },
    { eventUrl: '', case: 'an empty string' },
  ])(
    'given an event URL that is $case, when the footer renders, then a disabled button explains no information is available',
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

  it('given an event URL, when the footer renders, then a safe external info link is shown', () => {
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

  it('given an event URL without a scheme, when the footer renders, then https is prepended to the link', () => {
    const eventUrl = 'grapplingireland.ie/events/open-mat'
    const { getByRole } = render(
      <EventFooter {...defaultProps} eventUrl={eventUrl} />
    )
    const link = getByRole('link', {
      name: /get more information about/i,
    })
    expect(link).toHaveAttribute('href', `https://${eventUrl}`)
  })

  it('given an empty event name, when the footer renders, then the aria-label falls back to a generic description', () => {
    const { getByRole } = render(
      <EventFooter eventName="" eventUrl={undefined} />
    )

    const expectedAriaLabel = 'No information available for this event'
    const button = getByRole('button', { name: expectedAriaLabel })

    expect(button).toBeInTheDocument()
  })
})
