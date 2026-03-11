import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymHeader } from '../gym-card/gym-header'
import { MOCK_GYM_FULL } from './mocks/gym.mock'
import { getGymStatusLabel } from '@/utils/gymDisplayUtils'

describe('GymHeader Component', () => {
  const defaultProps = {
    name: MOCK_GYM_FULL.name,
    county: MOCK_GYM_FULL.county,
    status: MOCK_GYM_FULL.status,
    imageUrl: MOCK_GYM_FULL.imageUrl,
  }

  describe('Display Logic', () => {
    it('should render the name, county, and status correctly', () => {
      render(<GymHeader {...defaultProps} />)

      expect(
        screen.getByRole('heading', {
          name: new RegExp(`gym name: ${defaultProps.name}`, 'i'),
          level: 3,
        })
      ).toBeInTheDocument()
      expect(
        screen.getByText(`${defaultProps.county} County`, { selector: 'span' })
      ).toBeInTheDocument()
      expect(
        screen.getByText(getGymStatusLabel(defaultProps.status))
      ).toBeInTheDocument()
    })
  })

  describe('Image Rendering', () => {
    it('should render the image with correct alt text and src when imageUrl is provided', () => {
      render(<GymHeader {...defaultProps} />)
      const image = screen.getByRole('img', {
        name: `Exterior or interior of ${defaultProps.name}`,
      })

      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', defaultProps.imageUrl)
    })

    it('should not render an image if imageUrl is not provided', () => {
      render(<GymHeader {...defaultProps} imageUrl={undefined} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle an empty name gracefully with a fallback', () => {
      render(<GymHeader {...defaultProps} name="" />)

      expect(
        screen.getByRole('heading', {
          name: /gym name: unnamed gym/i,
          level: 3,
        })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('img', {
          name: 'Exterior or interior of Unnamed Gym',
        })
      ).toBeInTheDocument()
    })
  })
})
