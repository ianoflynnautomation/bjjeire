import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymFooter } from './../gym-card/gym-footer'
import { ensureExternalUrlScheme } from '@/utils/formatting-utils'

describe('GymFooter', () => {
  const defaultProps = {
    gymName: 'Test Gym',
  }

  it.each([
    { websiteUrl: undefined, case: 'undefined' },
    { websiteUrl: '', case: 'an empty string' },
    { websiteUrl: '   ', case: 'only whitespace' },
  ])(
    'given a website URL that is $case, when the footer renders, then a disabled button explains no website is available',
    ({ websiteUrl }) => {
      const { getByRole } = render(
        <GymFooter {...defaultProps} websiteUrl={websiteUrl} />
      )
      const expectedAriaLabel = `No website available for ${defaultProps.gymName}`
      const button = getByRole('button', { name: expectedAriaLabel })

      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
      expect(button).toHaveAccessibleName(expectedAriaLabel)
      expect(button).toHaveAttribute('title', expectedAriaLabel)
      expect(button).toHaveTextContent('Website Unavailable')
    }
  )

  it('given a website URL, when the footer renders, then a safe external website link is shown', () => {
    const website = 'testgym.com'
    const { getByRole } = render(
      <GymFooter {...defaultProps} websiteUrl={website} />
    )

    const expectedAriaLabel = `Visit website for ${defaultProps.gymName}`
    const link = getByRole('link', { name: expectedAriaLabel })

    expect(link).toBeInTheDocument()
    expect(link).not.toHaveAttribute('disabled')
    expect(link).toHaveAttribute('href', ensureExternalUrlScheme(website))
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('title', expectedAriaLabel)
    expect(link).toHaveTextContent('Visit Website')
  })

  it('given an empty gym name, when the footer renders, then the aria-label falls back to a generic description', () => {
    const { getByRole } = render(
      <GymFooter gymName="" websiteUrl={undefined} />
    )

    const expectedAriaLabel = 'No website available for this gym'
    const button = getByRole('button', { name: expectedAriaLabel })

    expect(button).toBeInTheDocument()
  })
})
