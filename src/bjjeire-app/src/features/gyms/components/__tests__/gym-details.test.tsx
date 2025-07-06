import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GymDetails } from '../gym-card/gym-details'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'
import { getGoogleMapsUrl } from '../../../../utils/mapUtils'

vi.unmock('../../../../utils/formattingUtils')
vi.unmock('../../../../utils/gymDisplayUtils')

vi.mock('../../../../utils/mapUtils')
vi.mock('../../../../components/ui/social-media/social-media-links', () => ({
  SocialMediaLinks: vi.fn(() => <div>Mocked Social Media</div>),
}))

describe('GymDetails Component', () => {
  beforeEach(() => {

    vi.clearAllMocks()


    ;(getGoogleMapsUrl as ReturnType<typeof vi.fn>).mockImplementation(
      location => `maps://?address=${location?.address}`
    )
  })

  it('should render all details correctly when provided with a full gym object', () => {
    render(<GymDetails gym={MOCK_GYM_FULL} />)

    expect(screen.getByText('BJJ Gi (All Levels)')).toBeInTheDocument()
    expect(screen.getByText('Kids BJJ')).toBeInTheDocument()
    expect(screen.getByText('Wrestling')).toBeInTheDocument()
    expect(screen.getByText(/1 free class/i)).toBeInTheDocument()
    expect(screen.getByText(/Your first class is on us!/i)).toBeInTheDocument()


    const locationLink = screen.getByRole('link', {
      name: /123 Main Street, Dublin, D01 A2B3/i,
    })
    expect(locationLink).toHaveAttribute(
      'href',
      `maps://?address=${MOCK_GYM_FULL.location.address}`
    )

    const affiliationLink = screen.getByRole('link', {
      name: /Affiliated with Global BJJ Federation/i,
    })
    expect(affiliationLink).toHaveAttribute('href', 'https://globalbjj.com')

    const timetableLink = screen.getByRole('link', { name: /View Timetable/i })
    expect(timetableLink).toHaveAttribute(
      'href',
      'https://elitefighters.ie/timetable'
    )

    expect(screen.getByText('Mocked Social Media')).toBeInTheDocument()
  })


  it('should hide sections for which data is not provided', () => {
    render(<GymDetails gym={MOCK_GYM_MINIMAL} />)

    expect(
      screen.getByRole('link', { name: /456 Side Street, Cork/i })
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('link', { name: /Affiliated with/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /View Timetable/i })
    ).not.toBeInTheDocument()
  })

  it('should render affiliation as text if the affiliation has no website', () => {
    const gymWithAffiliationNoWebsite = {
      ...MOCK_GYM_FULL,
      affiliation: { name: 'Local Club', website: undefined },
    }
    render(<GymDetails gym={gymWithAffiliationNoWebsite} />)

    const affiliationText = screen.getByText(/Affiliated with Local Club/i)
    expect(affiliationText).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Affiliated with Local Club/i })
    ).not.toBeInTheDocument()
  })

  it('should not render the affiliation section if the affiliation name is missing', () => {
    const gymWithoutAffiliationName = {
      ...MOCK_GYM_FULL,
      affiliation: { name: '' },
    }
    render(<GymDetails gym={gymWithoutAffiliationName} />)
    expect(screen.queryByText(/Affiliated with/i)).not.toBeInTheDocument()
  })

  it('should not render the location section if the address is null or empty', () => {
    const gymWithNoAddress = {
      ...MOCK_GYM_FULL,
      location: {
        ...MOCK_GYM_FULL.location,
        address: '',
      },
    }
    render(<GymDetails gym={gymWithNoAddress} />)
    expect(screen.queryByLabelText(/Location:/)).not.toBeInTheDocument()
  })
})
