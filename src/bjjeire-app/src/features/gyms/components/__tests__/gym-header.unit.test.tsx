import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymHeader } from '../gym-card/gym-header'
import { MOCK_GYM_FULL } from './mocks/gym.mock'
import { getGymStatusLabel } from '@/utils/gym-display-utils'
import { GymCardTestIds } from '@/constants/gymDataTestIds'

describe('GymHeader', () => {
  const defaultProps = {
    name: MOCK_GYM_FULL.name,
    county: MOCK_GYM_FULL.county,
    status: MOCK_GYM_FULL.status,
    imageUrl: MOCK_GYM_FULL.imageUrl,
    thumbnailUrl: MOCK_GYM_FULL.thumbnailUrl,
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

  it('given no image URL, when the header renders, then the fallback is shown instead of an image', () => {
    render(<GymHeader {...defaultProps} imageUrl={undefined} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(
      screen.getByTestId(GymCardTestIds.IMAGE_FALLBACK)
    ).toBeInTheDocument()
  })

  it('given thumbnail and full-size URLs, when the header renders, then the image srcSet references both', () => {
    render(<GymHeader {...defaultProps} />)
    const img = screen.getByRole('img', {
      name: `Exterior or interior of ${defaultProps.name}`,
    })

    expect(img.getAttribute('srcset')).toContain(MOCK_GYM_FULL.thumbnailUrl)
    expect(img.getAttribute('srcset')).toContain(MOCK_GYM_FULL.imageUrl)
  })

  it('given the image has not yet loaded, when the header renders, then a skeleton is shown', () => {
    render(<GymHeader {...defaultProps} />)

    expect(
      screen.getByTestId(GymCardTestIds.IMAGE_SKELETON)
    ).toBeInTheDocument()
  })

  it('given a visible skeleton, when the image finishes loading, then the skeleton is removed', () => {
    render(<GymHeader {...defaultProps} />)
    const img = screen.getByRole('img', {
      name: `Exterior or interior of ${defaultProps.name}`,
    })

    fireEvent.load(img)

    expect(
      screen.queryByTestId(GymCardTestIds.IMAGE_SKELETON)
    ).not.toBeInTheDocument()
  })

  it('given a rendered image, when it fails to load, then the fallback replaces it', () => {
    render(<GymHeader {...defaultProps} />)
    const img = screen.getByRole('img', {
      name: `Exterior or interior of ${defaultProps.name}`,
    })

    fireEvent.error(img)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(
      screen.getByTestId(GymCardTestIds.IMAGE_FALLBACK)
    ).toBeInTheDocument()
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
