import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymTrialOffer } from './../gym-card/gym-trial-offer'
import type { TrialOfferDto } from '@/types/gyms'

describe('GymTrialOffer Component', () => {
  describe('Rendering Logic', () => {
    it('should render nothing if the trialOffer prop is undefined', () => {
      // Arrange
      const { container } = render(<GymTrialOffer trialOffer={undefined} />)
      // Assert
      expect(container).toBeEmptyDOMElement()
    })

    it('should render nothing if the trial is not available', () => {
      // Arrange
      const trialUnavailable: TrialOfferDto = { isAvailable: false }
      // Act
      const { container } = render(
        <GymTrialOffer trialOffer={trialUnavailable} />
      )
      // Assert
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('Content and Accessibility', () => {
    it('should display the correct text and aria-label for multiple free classes', () => {
      const trial: TrialOfferDto = { isAvailable: true, freeClasses: 2 }
      render(<GymTrialOffer trialOffer={trial} />)
      const expectedText = '2 free classes'
      const expectedAriaLabel = `Trial Offer: ${expectedText}`

      const labeledElement = screen.getByLabelText(expectedAriaLabel)
      expect(labeledElement).toHaveTextContent(expectedText)
    })

    it('should handle singular text for one free class', () => {
      const trial: TrialOfferDto = { isAvailable: true, freeClasses: 1 }
      render(<GymTrialOffer trialOffer={trial} />)
      const expectedText = '1 free class'
      const expectedAriaLabel = `Trial Offer: ${expectedText}`

      const labeledElement = screen.getByLabelText(expectedAriaLabel)
      expect(labeledElement).toHaveTextContent(expectedText)
    })

    it('should display combined text and aria-label for free days and notes', () => {
      const trial: TrialOfferDto = {
        isAvailable: true,
        freeDays: 7,
        notes: 'Come and try us out!',
      }
      render(<GymTrialOffer trialOffer={trial} />)
      const expectedText = '7 free days. Come and try us out!'
      const expectedAriaLabel = `Trial Offer: ${expectedText}`

      const labeledElement = screen.getByLabelText(expectedAriaLabel)
      expect(labeledElement).toHaveTextContent(expectedText)
    })

    it('should display a fallback message and aria-label if trial has no details', () => {
      const trial: TrialOfferDto = { isAvailable: true }
      render(<GymTrialOffer trialOffer={trial} />)
      const fallbackText = 'Trial offer available (details not specified)'
      const expectedAriaLabel = `Trial Offer: ${fallbackText}`

      const labeledElement = screen.getByLabelText(expectedAriaLabel)
      expect(labeledElement).toHaveTextContent(fallbackText)
    })
  })
})
