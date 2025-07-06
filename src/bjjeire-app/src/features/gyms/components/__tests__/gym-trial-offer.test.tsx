import { render, screen} from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymTrialOffer } from './../gym-card/gym-trial-offer'
import { TrialOfferDto } from '../../../../types/gyms'

describe('GymTrialOffer Component', () => {
  it('should render nothing if trialOffer is undefined or not available', () => {

    const { container: containerUndefined } = render(
      <GymTrialOffer trialOffer={undefined} />
    )
    expect(containerUndefined).toBeEmptyDOMElement()

    const trialUnavailable: TrialOfferDto = { isAvailable: false }
    const { container: containerUnavailable } = render(
      <GymTrialOffer trialOffer={trialUnavailable} />
    )
    expect(containerUnavailable).toBeEmptyDOMElement()
  })

  it('should display the correct text for free classes', () => {
    const trial: TrialOfferDto = { isAvailable: true, freeClasses: 2 }
    render(<GymTrialOffer trialOffer={trial} />)
    expect(screen.getByText('2 free classes')).toBeInTheDocument()
  })

  it('should display the correct text for free days', () => {
    const trial: TrialOfferDto = { isAvailable: true, freeDays: 7 }
    render(<GymTrialOffer trialOffer={trial} />)
    expect(screen.getByText('7 free days')).toBeInTheDocument()
  })

  it('should display the correct text for notes only', () => {
    const trial: TrialOfferDto = {
      isAvailable: true,
      notes: 'Special intro offer.',
    }
    render(<GymTrialOffer trialOffer={trial} />)
    expect(screen.getByText('Special intro offer.')).toBeInTheDocument()
  })

  it('should display combined text for free classes and notes', () => {
    const trial: TrialOfferDto = {
      isAvailable: true,
      freeClasses: 1,
      notes: 'Book online.',
    }
    render(<GymTrialOffer trialOffer={trial} />)
    expect(screen.getByText('1 free class. Book online.')).toBeInTheDocument()
  })

  it('should display a fallback message if trial is available but has no details', () => {
    const trial: TrialOfferDto = { isAvailable: true }
    render(<GymTrialOffer trialOffer={trial} />)
    expect(
      screen.getByText('Trial offer available (details not specified)')
    ).toBeInTheDocument()
  })
})
