import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymTrialOffer } from './../gym-card/gym-trial-offer'
import { TrialOfferDto } from '../../../../types/gyms'

describe('GymTrialOffer Component', () => {
  describe('Rendering Logic', () => {
    it('should render nothing if the trialOffer prop is undefined', () => {
      const { container } = render(<GymTrialOffer trialOffer={undefined} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('should render nothing if the trial is not available', () => {
      const trialUnavailable: TrialOfferDto = { isAvailable: false }
      const { container } = render(
        <GymTrialOffer trialOffer={trialUnavailable} />
      )
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('Content and Accessibility', () => {
    it('should display the correct text and aria-label for multiple free classes', () => {
      // Arrange
      const trial: TrialOfferDto = { isAvailable: true, freeClasses: 2 }
      render(<GymTrialOffer trialOffer={trial} />)

      // Act
      const expectedText = '2 free classes'
      const expectedAriaLabel = `Trial Offer: ${expectedText}`

      // Assert
      const labeledElement = screen.getByLabelText(expectedAriaLabel)
      expect(labeledElement).toHaveTextContent(expectedText)
    })

    it('should handle singular text for one free class', () => {
      // Arrange
      const trial: TrialOfferDto = { isAvailable: true, freeClasses: 1 }
      render(<GymTrialOffer trialOffer={trial} />)

      // Act
      const expectedText = '1 free class'
      const expectedAriaLabel = `Trial Offer: ${expectedText}`

      // Assert
      const labeledElement = screen.getByLabelText(expectedAriaLabel)
      expect(labeledElement).toHaveTextContent(expectedText)
    })

    it('should display combined text and aria-label for free days and notes', () => {
      // Arrange
      const trial: TrialOfferDto = {
        isAvailable: true,
        freeDays: 7,
        notes: 'Come and try us out!',
      }
      render(<GymTrialOffer trialOffer={trial} />)

      // Act
      const expectedText = '7 free days. Come and try us out!'
      const expectedAriaLabel = `Trial Offer: ${expectedText}`

      // Assert
      const labeledElement = screen.getByLabelText(expectedAriaLabel)
      expect(labeledElement).toHaveTextContent(expectedText)
    })

    it('should display a fallback message and aria-label if trial has no details', () => {
      // Arrange
      const trial: TrialOfferDto = { isAvailable: true }
      render(<GymTrialOffer trialOffer={trial} />)

      // Act
      const fallbackText = 'Trial offer available (details not specified)'
      const expectedAriaLabel = `Trial Offer: ${fallbackText}`

      // Assert
      const labeledElement = screen.getByLabelText(expectedAriaLabel)
      expect(labeledElement).toHaveTextContent(fallbackText)
    })
  })
})
