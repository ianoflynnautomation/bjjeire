import { render, screen, within, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymCard } from './../gym-card/gym-card'
import {
  MOCK_GYM_FULL,
  MOCK_GYM_MINIMAL,
  MOCK_GYM_NO_WEBSITE,
} from './mocks/gym.mock'
import { GymCardTestIds } from '@/constants/gymDataTestIds'

function renderCard(gym = MOCK_GYM_FULL): HTMLElement {
  render(<GymCard gym={gym} />)
  return screen.getByRole('article', { name: new RegExp(gym.name, 'i') })
}

describe('GymCard', () => {
  it('given a gym with full details, when the card renders, then name, status, county, address link and website link are shown', () => {
    const card = renderCard(MOCK_GYM_FULL)
    const expectedAddress = `${MOCK_GYM_FULL.location.address} (${MOCK_GYM_FULL.location.venue})`

    const name = within(card).getByRole('heading', {
      name: new RegExp(MOCK_GYM_FULL.name, 'i'),
      level: 3,
    })
    const addressLink = within(card).getByRole('link', {
      name: new RegExp(MOCK_GYM_FULL.location.address, 'i'),
    })
    const websiteLink = within(card).getByRole('link', {
      name: new RegExp(`visit website for ${MOCK_GYM_FULL.name}`, 'i'),
    })

    expect(name).toHaveTextContent(MOCK_GYM_FULL.name)
    expect(within(card).getByText(MOCK_GYM_FULL.status)).toBeInTheDocument()
    expect(
      within(card).getByText(`${MOCK_GYM_FULL.county} County`)
    ).toBeInTheDocument()
    expect(addressLink).toHaveTextContent(expectedAddress)
    expect(websiteLink).toBeInTheDocument()
    expect(websiteLink).toHaveAttribute('href', MOCK_GYM_FULL.website)
  })

  it('given a gym with minimal details, when the card renders, then its status is shown and the website button is disabled', () => {
    const card = renderCard(MOCK_GYM_MINIMAL)

    const websiteButton = within(card).getByRole('button', {
      name: /no website available for community bjj club/i,
    })
    expect(
      within(card).getByRole('heading', {
        name: MOCK_GYM_MINIMAL.name,
        level: 3,
      })
    ).toBeInTheDocument()
    expect(within(card).getByText('Pending Approval')).toBeInTheDocument()
    expect(within(card).queryByText('Active')).not.toBeInTheDocument()
    expect(websiteButton).toBeDisabled()
    expect(websiteButton).toHaveTextContent('Website Unavailable')
  })

  it('given a gym without a website, when the card renders, then a disabled button replaces the website link', () => {
    const card = renderCard(MOCK_GYM_NO_WEBSITE)
    const websiteButton = within(card).getByRole('button', {
      name: /no website available for elite fighters academy/i,
    })

    expect(websiteButton.tagName).toBe('BUTTON')
    expect(websiteButton).toBeDisabled()
  })

  describe('Image', () => {
    const imageName = new RegExp(
      `exterior or interior of ${MOCK_GYM_FULL.name}`,
      'i'
    )

    it('given a gym with an image URL, when the card renders, then the image is shown with descriptive alt text', () => {
      const card = renderCard(MOCK_GYM_FULL)
      const img = within(card).getByRole('img', { name: imageName })

      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute(
        'alt',
        `Exterior or interior of ${MOCK_GYM_FULL.name}`
      )
      expect(
        within(card).queryByTestId(GymCardTestIds.IMAGE_FALLBACK)
      ).not.toBeInTheDocument()
    })

    it('given a gym without an image URL, when the card renders, then the fallback is shown instead of an image', () => {
      const card = renderCard(MOCK_GYM_MINIMAL)

      expect(within(card).queryByRole('img')).not.toBeInTheDocument()
      expect(
        within(card).getByTestId(GymCardTestIds.IMAGE_FALLBACK)
      ).toBeInTheDocument()
    })

    it('given thumbnail and full-size URLs, when the card renders, then the image srcSet references both', () => {
      const card = renderCard(MOCK_GYM_FULL)
      const img = within(card).getByRole('img', { name: imageName })

      expect(img).toHaveAttribute('srcset')
      expect(img.getAttribute('srcset')).toContain(MOCK_GYM_FULL.thumbnailUrl)
      expect(img.getAttribute('srcset')).toContain(MOCK_GYM_FULL.imageUrl)
    })

    it('given the image has not yet loaded, when the card renders, then a skeleton is shown', () => {
      const card = renderCard(MOCK_GYM_FULL)

      expect(
        within(card).getByTestId(GymCardTestIds.IMAGE_SKELETON)
      ).toBeInTheDocument()
    })

    it('given a visible skeleton, when the image finishes loading, then the skeleton is removed', () => {
      const card = renderCard(MOCK_GYM_FULL)
      const img = within(card).getByRole('img', { name: imageName })

      fireEvent.load(img)

      expect(
        within(card).queryByTestId(GymCardTestIds.IMAGE_SKELETON)
      ).not.toBeInTheDocument()
    })

    it('given a rendered image, when it fails to load, then the fallback replaces it', () => {
      const card = renderCard(MOCK_GYM_FULL)
      const img = within(card).getByRole('img', { name: imageName })

      fireEvent.error(img)

      expect(within(card).queryByRole('img')).not.toBeInTheDocument()
      expect(
        within(card).getByTestId(GymCardTestIds.IMAGE_FALLBACK)
      ).toBeInTheDocument()
    })
  })
})
