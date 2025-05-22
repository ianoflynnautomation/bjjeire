import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GymDetails } from './../gym-card/gym-details'
import { GymCardTestIds } from '../../../../constants/gymDataTestIds'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'
import {
  ensureExternalUrlScheme,
  formatDisplayUrl,
} from '../../../../utils/formattingUtils'
import { getGoogleMapsUrl } from '../../../../utils/mapUtils'

// Mock child components
vi.mock('../../../../components/ui/icons/detail-item', () => ({
  DetailItem: vi.fn(
    ({
      children,
      'data-testid': dtId,
      icon,
      ariaLabel,
    }) => (
      <div data-testid={dtId} aria-label={ariaLabel}>
        <div data-testid={`mock-detail-item-icon-for-${dtId}`}>
          {icon && icon.type.name}
        </div>
        <div data-testid={`mock-detail-item-content-for-${dtId}`}>
          {children}
        </div>
      </div>
    )
  ),
}))
vi.mock('./GymOfferedClasses', () => ({
  GymOfferedClasses: vi.fn(({ 'data-testid': dtId }) => (
    <div data-testid={dtId}>Mocked GymOfferedClasses</div>
  )),
}))
vi.mock('./GymTrialOffer', () => ({
  GymTrialOffer: vi.fn(({ 'data-testid': dtId }) => (
    <div data-testid={dtId}>Mocked GymTrialOffer</div>
  )),
}))
vi.mock('../../../../components/ui/social-media/social-media-links', () => ({
  SocialMediaLinks: vi.fn(({ 'data-testid': dtId }) => (
    <div data-testid={dtId}>Mocked SocialMediaLinks</div>
  )),
}))

describe('GymDetails Component', () => {
  const defaultSuffix =
    MOCK_GYM_FULL.id || MOCK_GYM_FULL.name.replace(/\s+/g, '-').toLowerCase()

  beforeEach(() => {
    ;(ensureExternalUrlScheme as ReturnType<typeof vi.fn>).mockImplementation(
      url => (url ? `https://${url.replace(/^https?:\/\//, '')}` : undefined)
    )
    ;(formatDisplayUrl as ReturnType<typeof vi.fn>).mockImplementation(
      url => `formatted-${url}`
    )
    ;(getGoogleMapsUrl as ReturnType<typeof vi.fn>).mockImplementation(
      loc => `maps://?address=${loc?.address}`
    )
  })

  it('renders all details for a full gym object', () => {
    render(
      <GymDetails gym={MOCK_GYM_FULL} testIdInstanceSuffix={defaultSuffix} />
    )

    // Location
    const addressDetailItem = screen.getByTestId(
      GymCardTestIds.DETAILS.ADDRESS(defaultSuffix)
    )
    expect(addressDetailItem).toBeInTheDocument()
    expect(
      within(addressDetailItem).getByText(
        `${MOCK_GYM_FULL.location.address} (${MOCK_GYM_FULL.location.venue})`
      )
    ).toBeInTheDocument()
    expect(within(addressDetailItem).getByRole('link')).toHaveAttribute(
      'href',
      `maps://?address=${MOCK_GYM_FULL.location.address}`
    )

    // Affiliation
    const affiliationDetailItem = screen.getByTestId(
      GymCardTestIds.DETAILS.AFFILIATION(defaultSuffix)
    )
    expect(affiliationDetailItem).toBeInTheDocument()
    expect(
      within(affiliationDetailItem).getByText(
        `Affiliated with ${MOCK_GYM_FULL.affiliation!.name}`
      )
    ).toBeInTheDocument()
    expect(within(affiliationDetailItem).getByRole('link')).toHaveAttribute(
      'href',
      `https://${MOCK_GYM_FULL.affiliation!.website!.replace(/^https?:\/\//, '')}`
    )

    // Timetable
    const timetableDetailItem = screen.getByTestId(
      GymCardTestIds.DETAILS.TIMETABLE(defaultSuffix)
    )
    expect(timetableDetailItem).toBeInTheDocument()
    expect(
      within(timetableDetailItem).getByText('View Timetable')
    ).toBeInTheDocument()
    expect(within(timetableDetailItem).getByRole('link')).toHaveAttribute(
      'href',
      `https://${MOCK_GYM_FULL.timetableUrl!.replace(/^https?:\/\//, '')}`
    )

    // Offered Classes, Trial Offer, Social Media (check if mocks are rendered)
    expect(
      screen.getByTestId(GymCardTestIds.DETAILS.CLASSES(defaultSuffix))
    ).toHaveTextContent('Mocked GymOfferedClasses')
    expect(
      screen.getByTestId(GymCardTestIds.DETAILS.TRIAL(defaultSuffix))
    ).toHaveTextContent('Mocked GymTrialOffer')
    expect(
      screen.getByTestId(GymCardTestIds.DETAILS.SOCIAL_MEDIA(defaultSuffix))
    ).toHaveTextContent('Mocked SocialMediaLinks')
  })

  it('renders correctly with minimal gym data (some sections should not appear)', () => {
    const minimalSuffix =
      MOCK_GYM_MINIMAL.id ||
      MOCK_GYM_MINIMAL.name.replace(/\s+/g, '-').toLowerCase()
    render(
      <GymDetails gym={MOCK_GYM_MINIMAL} testIdInstanceSuffix={minimalSuffix} />
    )

    // Location (address is present in MOCK_GYM_MINIMAL.location)
    expect(
      screen.getByTestId(GymCardTestIds.DETAILS.ADDRESS(minimalSuffix))
    ).toBeInTheDocument()

    // Affiliation (not present)
    expect(
      screen.queryByTestId(GymCardTestIds.DETAILS.AFFILIATION(minimalSuffix))
    ).not.toBeInTheDocument()

    // Timetable (not present)
    expect(
      screen.queryByTestId(GymCardTestIds.DETAILS.TIMETABLE(minimalSuffix))
    ).not.toBeInTheDocument()

    // Social Media (present because it's not optional in type, but links might be empty)
    expect(
      screen.getByTestId(GymCardTestIds.DETAILS.SOCIAL_MEDIA(minimalSuffix))
    ).toBeInTheDocument()
  })

  it('does not render affiliation if affiliation name is missing', () => {
    const gymWithoutAffiliationName = {
      ...MOCK_GYM_FULL,
      affiliation: { name: '' },
    }
    render(
      <GymDetails
        gym={gymWithoutAffiliationName}
        testIdInstanceSuffix={defaultSuffix}
      />
    )
    expect(
      screen.queryByTestId(GymCardTestIds.DETAILS.AFFILIATION(defaultSuffix))
    ).not.toBeInTheDocument()
  })

  it('renders affiliation without a link if website is missing', () => {
    const gymWithAffiliationNoWebsite = {
      ...MOCK_GYM_FULL,
      affiliation: { name: 'Local Club', website: undefined },
    }
    render(
      <GymDetails
        gym={gymWithAffiliationNoWebsite}
        testIdInstanceSuffix={defaultSuffix}
      />
    )
    const affiliationItem = screen.getByTestId(
      GymCardTestIds.DETAILS.AFFILIATION(defaultSuffix)
    )
    expect(
      within(affiliationItem).getByText('Affiliated with Local Club')
    ).toBeInTheDocument()
    expect(within(affiliationItem).queryByRole('link')).not.toBeInTheDocument()
  })

  it('uses provided root data-testid or defaults correctly', () => {
    const customRootId = 'custom-details-root'
    render(
      <GymDetails
        gym={MOCK_GYM_FULL}
        data-testid={customRootId}
        testIdInstanceSuffix={defaultSuffix}
      />
    )
    expect(screen.getByTestId(customRootId)).toBeInTheDocument()

    render(
      <GymDetails
        gym={MOCK_GYM_FULL}
        data-testid={undefined}
        testIdInstanceSuffix={defaultSuffix}
      />
    )
    expect(
      screen.getByTestId(GymCardTestIds.DETAILS.ROOT(defaultSuffix))
    ).toBeInTheDocument()
  })
})
