import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymHeader } from '../gym-card/gym-header'
import { MOCK_GYM_FULL } from './mocks/gym.mock'
import { getGymStatusLabel } from '@/utils/gym-display-utils'

describe('GymHeader', () => {
  const defaultProps = {
    name: MOCK_GYM_FULL.name,
    county: MOCK_GYM_FULL.county,
    status: MOCK_GYM_FULL.status,
    imageUrl: MOCK_GYM_FULL.imageUrl,
  }

  it('given a gym, when the header renders, then the name, county and status are shown', () => {
    render(<GymHeader {...defaultProps} />)

    expect(
      screen.getByRole('heading', {
        name: defaultProps.name,
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

  it('given an image URL, when the header renders, then the image is shown with descriptive alt text', () => {
    render(<GymHeader {...defaultProps} />)
    const image = screen.getByRole('img', {
      name: `Exterior or interior of ${defaultProps.name}`,
    })

    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', defaultProps.imageUrl)
  })

  it('given no image URL, when the header renders, then no image is shown', () => {
    render(<GymHeader {...defaultProps} imageUrl={undefined} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('given an empty gym name, when the header renders, then a fallback name is used for the heading and alt text', () => {
    render(<GymHeader {...defaultProps} name="" />)

    expect(
      screen.getByRole('heading', {
        name: /unnamed gym/i,
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
