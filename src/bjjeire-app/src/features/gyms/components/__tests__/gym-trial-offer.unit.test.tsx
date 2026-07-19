import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymTrialOffer } from './../gym-card/gym-trial-offer'
import type { TrialOfferDto } from '@/types/gyms'

describe('GymTrialOffer', () => {
  it('given no trial offer, when the component renders, then nothing is shown', () => {
    const { container } = render(<GymTrialOffer trialOffer={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('given a trial that is not available, when the component renders, then nothing is shown', () => {
    const trialUnavailable: TrialOfferDto = { isAvailable: false }
    const { container } = render(
      <GymTrialOffer trialOffer={trialUnavailable} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('given multiple free classes, when the offer renders, then the plural text and aria-label are shown', () => {
    const trial: TrialOfferDto = { isAvailable: true, freeClasses: 2 }
    render(<GymTrialOffer trialOffer={trial} />)
    const expectedText = '2 free classes'
    const expectedAriaLabel = `Trial Offer: ${expectedText}`

    const labeledElement = screen.getByLabelText(expectedAriaLabel)
    expect(labeledElement).toHaveTextContent(expectedText)
  })

  it('given a single free class, when the offer renders, then the singular text is shown', () => {
    const trial: TrialOfferDto = { isAvailable: true, freeClasses: 1 }
    render(<GymTrialOffer trialOffer={trial} />)
    const expectedText = '1 free class'
    const expectedAriaLabel = `Trial Offer: ${expectedText}`

    const labeledElement = screen.getByLabelText(expectedAriaLabel)
    expect(labeledElement).toHaveTextContent(expectedText)
  })

  it('given free days with notes, when the offer renders, then the combined text is shown', () => {
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

  it('given an available trial without details, when the offer renders, then a fallback message is shown', () => {
    const trial: TrialOfferDto = { isAvailable: true }
    render(<GymTrialOffer trialOffer={trial} />)
    const fallbackText = 'Trial offer available (details not specified)'
    const expectedAriaLabel = `Trial Offer: ${fallbackText}`

    const labeledElement = screen.getByLabelText(expectedAriaLabel)
    expect(labeledElement).toHaveTextContent(fallbackText)
  })
})
