import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GymDetails } from '../gym-card/gym-details'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'
import { getGoogleMapsUrl } from '../../../../utils/mapUtils'

vi.mock('../../../../utils/mapUtils')
vi.mock('../../../../components/ui/social-media/social-media-links', () => ({
  SocialMediaLinks: vi.fn(() => <div data-testid="mock-social-media" />),
}))

describe('GymDetails Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getGoogleMapsUrl as ReturnType<typeof vi.fn>).mockImplementation(
      location => `maps://?address=${location?.address}`
    )
  })

  describe('With Full Data', () => {
    it('should render all sections correctly', () => {
      // Arrange
      render(
        <GymDetails
          gym={MOCK_GYM_FULL}
          testIdInstanceSuffix={MOCK_GYM_FULL.id}
        />
      )

      // Assert
      expect(screen.getByLabelText(/Location:/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Affiliation:/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Timetable:/)).toBeInTheDocument()
      expect(screen.getByTestId('mock-social-media')).toBeInTheDocument()
    })
  })

  describe('With Minimal Data', () => {
    it('should hide sections when their data is missing', () => {
      // Arrange
      render(<GymDetails gym={MOCK_GYM_MINIMAL} />)

      // Assert:
      expect(screen.getByLabelText(/Location:/)).toBeInTheDocument()
      expect(screen.getByTestId('mock-social-media')).toBeInTheDocument()
      expect(screen.queryByLabelText(/Affiliation:/)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Timetable:/)).not.toBeInTheDocument()
    })
  })
})
