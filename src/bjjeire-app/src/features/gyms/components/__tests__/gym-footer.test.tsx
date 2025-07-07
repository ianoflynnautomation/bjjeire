import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymFooter } from './../gym-card/gym-footer'
import { ensureExternalUrlScheme } from '../../../../utils/formattingUtils'

describe('GymFooter Component', () => {
  const defaultProps = {
    gymName: 'Test Gym',
  }

  describe('When Website is Unavailable', () => {
    it.each([
      { websiteUrl: undefined, case: 'undefined' },
      { websiteUrl: '', case: 'an empty string' },
      { websiteUrl: '   ', case: 'only whitespace' },
    ])(
      'should render a disabled button when websiteUrl is $case',
      ({ websiteUrl }) => {
        // Arrange
        const { getByRole } = render(
          <GymFooter {...defaultProps} websiteUrl={websiteUrl} />
        )

        // Act
        const expectedAriaLabel = `No website available for ${defaultProps.gymName}`
        const button = getByRole('button', { name: expectedAriaLabel })

        // Assert
        expect(button).toBeInTheDocument()
        expect(button).toBeDisabled()
        expect(button).toHaveAttribute('title', expectedAriaLabel)
        expect(button).toHaveTextContent('Website Unavailable')
      }
    )
  })

  describe('When Website is Available', () => {
    it('should render an active link with all correct attributes', () => {
      // Arrange
      const website = 'testgym.com'
      const { getByRole } = render(
        <GymFooter {...defaultProps} websiteUrl={website} />
      )

      // Act
      const expectedAriaLabel = `Visit website for ${defaultProps.gymName}`
      const link = getByRole('link', { name: expectedAriaLabel })

      // Assert
      expect(link).toBeInTheDocument()
      expect(link).not.toBeDisabled()
      expect(link).toHaveAttribute('href', ensureExternalUrlScheme(website))
      expect(link).toHaveAttribute('title', expectedAriaLabel)
      expect(link).toHaveTextContent('Visit Website')
    })
  })

  describe('Edge Cases', () => {
    it('should use a fallback in the aria-label if gymName is empty', () => {
      // Arrange
      const { getByRole } = render(
        <GymFooter gymName="" websiteUrl={undefined} />
      )

      // Act
      const expectedAriaLabel = 'No website available for this gym'
      const button = getByRole('button', { name: expectedAriaLabel })

      // Assert
      expect(button).toBeInTheDocument()
    })
  })
})
