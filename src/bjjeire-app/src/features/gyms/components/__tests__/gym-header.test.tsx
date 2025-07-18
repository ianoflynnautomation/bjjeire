import { render, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymHeader } from '../gym-card/gym-header'
import { MOCK_GYM_FULL } from './mocks/gym.mock'
import { getGymStatusLabel } from '../../../../utils/gymDisplayUtils'
import { GymCardTestIds } from '../../../../constants/gymDataTestIds'

describe('GymHeader Component', () => {
  const defaultProps = {
    name: MOCK_GYM_FULL.name,
    county: MOCK_GYM_FULL.county,
    status: MOCK_GYM_FULL.status,
    imageUrl: MOCK_GYM_FULL.imageUrl,
    testIdInstanceSuffix: 'test-id',
  }

  describe.concurrent('Display Logic', () => {
    it('should render the name, county, and status correctly', () => {
      // Arrange
      const { getByTestId } = render(<GymHeader {...defaultProps} />)

      // Act
      const header = getByTestId(
        GymCardTestIds.HEADER.ROOT
      )
      const statusBadge = getByTestId(
        GymCardTestIds.HEADER.STATUS_BADGE
      )
      const countyText = getByTestId(
        GymCardTestIds.HEADER.COUNTY
      )

      // Assert
      expect(
        within(header).getByRole('heading', {
          name: `Gym name: ${defaultProps.name}`,
        })
      ).toBeInTheDocument()

      expect(statusBadge).toHaveTextContent(
        getGymStatusLabel(defaultProps.status)
      )

      expect(countyText).toHaveTextContent(`${defaultProps.county} County`)
    })
  })

  describe('Image Rendering', () => {
    it('should render the image with correct alt text and src when imageUrl is provided', () => {
      // Arrange
      const { getByRole } = render(<GymHeader {...defaultProps} />)

      // Act
      const image = getByRole('img', {
        name: `Exterior or interior of ${defaultProps.name}`,
      })

      // Assert
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', defaultProps.imageUrl)
    })

    it('should not render an image if imageUrl is not provided', () => {
      // Arrange
      const { queryByRole } = render(
        <GymHeader {...defaultProps} imageUrl={undefined} />
      )

      // Assert
      expect(queryByRole('img')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle an empty name gracefully with a fallback', () => {
      // Arrange
      const { getByRole } = render(<GymHeader {...defaultProps} name="" />)

      // Assert
      expect(
        getByRole('heading', { name: 'Gym name: Unnamed Gym' })
      ).toBeInTheDocument()
      expect(
        getByRole('img', { name: 'Exterior or interior of Unnamed Gym' })
      ).toBeInTheDocument()
    })
  })
})
