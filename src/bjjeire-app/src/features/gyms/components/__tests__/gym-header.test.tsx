import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GymHeader } from '../gym-card/gym-header'
import { MOCK_GYM_FULL } from './mocks/gym.mock'

vi.unmock('../../../../utils/gymDisplayUtils')

describe('GymHeader Component', () => {
  const defaultProps = {
    name: MOCK_GYM_FULL.name,
    county: MOCK_GYM_FULL.county,
    status: MOCK_GYM_FULL.status,
    imageUrl: MOCK_GYM_FULL.imageUrl,
  }

  it('should render the gym name, county, and status', () => {
    render(<GymHeader {...defaultProps} />)

    expect(
      screen.getByRole('heading', {
        name: `Gym name: ${defaultProps.name}`,
        level: 3,
      })
    ).toBeInTheDocument()

    expect(screen.getByText('Dublin County')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should render the image with correct alt text when imageUrl is provided', () => {
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

  it('should handle an unnamed gym gracefully', () => {
    render(<GymHeader {...defaultProps} name="" />)

    expect(
      screen.getByRole('heading', { name: 'Gym name: Unnamed Gym', level: 3 })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('img', { name: 'Exterior or interior of Unnamed Gym' })
    ).toBeInTheDocument()
  })
})
