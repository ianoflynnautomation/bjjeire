import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GymTrialOffer } from './../gym-card/gym-trial-offer'
import { GymTrialOfferTestIds } from '../../../../constants/gymDataTestIds'
import { TrialOfferDto } from '../../../../types/gyms'

// Mock DetailItem
vi.mock('../../../../components/ui/icons/detail-item', () => ({
  DetailItem: vi.fn(
    ({
      children,
      'data-testid': dtId,
      icon,
      ariaLabel,
      testIdInstanceSuffix: suffix,
    }) => (
      <div data-testid={dtId} aria-label={ariaLabel}>
        <div data-testid={`mock-detail-item-icon-${suffix}`}>{icon}</div>
        <div data-testid={`mock-detail-item-content-${suffix}`}>{children}</div>
      </div>
    )
  ),
}))

describe('GymTrialOffer Component', () => {
  const defaultProps = {
    testIdInstanceSuffix: 'test-suffix-trial',
  }

  it('renders nothing if trialOffer is undefined or not available', () => {
    const { container: containerUndefined } = render(
      <GymTrialOffer {...defaultProps} trialOffer={undefined} />
    )
    expect(containerUndefined.firstChild).toBeNull()

    const trialUnavailable: TrialOfferDto = { isAvailable: false }
    const { container: containerUnavailable } = render(
      <GymTrialOffer {...defaultProps} trialOffer={trialUnavailable} />
    )
    expect(containerUnavailable.firstChild).toBeNull()
  })

  it('renders DetailItem with correct props when trial is available', () => {
    const trial: TrialOfferDto = {
      isAvailable: true,
      freeClasses: 1,
      notes: 'First class free!',
    }
    render(
      <GymTrialOffer
        {...defaultProps}
        trialOffer={trial}
        data-testid={GymTrialOfferTestIds.ROOT(
          defaultProps.testIdInstanceSuffix
        )}
      />
    )
    const detailItem = screen.getByTestId(
      GymTrialOfferTestIds.ROOT(defaultProps.testIdInstanceSuffix)
    )
    expect(detailItem).toBeInTheDocument()
    expect(
      screen.getByTestId(
        `mock-detail-item-content-${defaultProps.testIdInstanceSuffix}`
      )
    ).toBeInTheDocument()
  })

  it('displays correct content for free classes', () => {
    const trial: TrialOfferDto = { isAvailable: true, freeClasses: 2 }
    render(<GymTrialOffer {...defaultProps} trialOffer={trial} />)
    const contentArea = screen.getByTestId(
      `mock-detail-item-content-${defaultProps.testIdInstanceSuffix}`
    )
    expect(within(contentArea).getByText('2 free classes')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Trial Offer: 2 free classes')
    ).toBeInTheDocument()
  })

  it('displays correct content for free days', () => {
    const trial: TrialOfferDto = { isAvailable: true, freeDays: 7 }
    render(<GymTrialOffer {...defaultProps} trialOffer={trial} />)
    const contentArea = screen.getByTestId(
      `mock-detail-item-content-${defaultProps.testIdInstanceSuffix}`
    )
    expect(within(contentArea).getByText('7 free days')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Trial Offer: 7 free days')
    ).toBeInTheDocument()
  })

  it('displays correct content for notes only', () => {
    const trial: TrialOfferDto = {
      isAvailable: true,
      notes: 'Special intro offer.',
    }
    render(<GymTrialOffer {...defaultProps} trialOffer={trial} />)
    const contentArea = screen.getByTestId(
      `mock-detail-item-content-${defaultProps.testIdInstanceSuffix}`
    )
    expect(
      within(contentArea).getByText('Special intro offer.')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Trial Offer: Special intro offer.')
    ).toBeInTheDocument()
  })

  it('displays correct content for free classes and notes', () => {
    const trial: TrialOfferDto = {
      isAvailable: true,
      freeClasses: 1,
      notes: 'Book online.',
    }
    render(<GymTrialOffer {...defaultProps} trialOffer={trial} />)
    const contentArea = screen.getByTestId(
      `mock-detail-item-content-${defaultProps.testIdInstanceSuffix}`
    )
    expect(
      within(contentArea).getByText('1 free class. Book online.')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Trial Offer: 1 free class. Book online.')
    ).toBeInTheDocument()
  })

  it('displays fallback text if no specific offer details are provided but isAvailable is true', () => {
    const trial: TrialOfferDto = { isAvailable: true }
    render(<GymTrialOffer {...defaultProps} trialOffer={trial} />)
    const contentArea = screen.getByTestId(
      `mock-detail-item-content-${defaultProps.testIdInstanceSuffix}`
    )
    expect(
      within(contentArea).getByText(
        'Trial offer available (details not specified)'
      )
    ).toBeInTheDocument()
  })
})
