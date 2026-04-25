import { render, screen, within, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymCard } from './../gym-card/gym-card'
import {
  MOCK_GYM_FULL,
  MOCK_GYM_MINIMAL,
  MOCK_GYM_NO_WEBSITE,
} from './mocks/gym.mock'
import { GymsPageTestIds, GymCardTestIds } from '@/constants/gymDataTestIds'

describe('GymCard Component', () => {
  describe('Positive Scenarios', () => {
    it('should render all sections with correct content for a full gym object', () => {
      render(
        <GymCard gym={MOCK_GYM_FULL} data-testid={GymsPageTestIds.LIST_ITEM} />
      )
      const expectedAddress = `${MOCK_GYM_FULL.location.address} (${MOCK_GYM_FULL.location.venue})`

      const card = screen.getByTestId(GymsPageTestIds.LIST_ITEM)

      const name = within(card).getByRole('heading', {
        name: new RegExp(MOCK_GYM_FULL.name, 'i'),
        level: 3,
      })
      const status = within(card).getByTestId(GymCardTestIds.STATUS_BADGE)
      const county = within(card).getByTestId(GymCardTestIds.COUNTY)
      const addressLink = within(card).getByRole('link', {
        name: new RegExp(MOCK_GYM_FULL.location.address, 'i'),
      })
      const websiteLink = within(card).getByRole('link', {
        name: new RegExp(`visit website for ${MOCK_GYM_FULL.name}`, 'i'),
      })

      expect(name).toHaveTextContent(MOCK_GYM_FULL.name)
      expect(status).toHaveTextContent(MOCK_GYM_FULL.status)
      expect(county).toHaveTextContent(`${MOCK_GYM_FULL.county} County`)
      expect(addressLink).toHaveTextContent(expectedAddress)
      expect(websiteLink).toBeInTheDocument()
      expect(websiteLink).toHaveAttribute('href', MOCK_GYM_FULL.website)
    })
  })

  describe('Negative Scenarios', () => {
    it('should render correctly with minimal gym data and hide optional sections', () => {
      render(
        <GymCard
          gym={MOCK_GYM_MINIMAL}
          data-testid={GymsPageTestIds.LIST_ITEM}
        />
      )
      const card = screen.getByTestId(GymsPageTestIds.LIST_ITEM)

      const websiteLink = within(card).getByRole('button', {
        name: /no website available for community bjj club/i,
      })
      expect(within(card).getByTestId(GymCardTestIds.NAME)).toHaveTextContent(
        MOCK_GYM_MINIMAL.name
      )
      expect(
        within(card).getByTestId(GymCardTestIds.STATUS_BADGE)
      ).toHaveTextContent('Pending Approval')
      expect(websiteLink).toBeDisabled()
      expect(websiteLink).toHaveTextContent('Website Unavailable')
    })
  })

  describe('Edge Cases', () => {
    it('should disable the website link if the website URL is missing', () => {
      render(
        <GymCard
          gym={MOCK_GYM_NO_WEBSITE}
          data-testid={GymsPageTestIds.LIST_ITEM}
        />
      )
      const card = screen.getByTestId(GymsPageTestIds.LIST_ITEM)
      const websiteLink = within(card).getByRole('button', {
        name: /no website available for elite fighters academy/i,
      })
      expect(within(card).getByTestId(GymCardTestIds.NAME)).toHaveTextContent(
        MOCK_GYM_NO_WEBSITE.name
      )

      expect(websiteLink.tagName).toBe('BUTTON')
      expect(websiteLink).toBeDisabled()
    })

    it('should correctly display a non-active status like "Pending Approval"', () => {
      render(
        <GymCard
          gym={MOCK_GYM_MINIMAL}
          data-testid={GymsPageTestIds.LIST_ITEM}
        />
      )
      const card = screen.getByTestId(GymsPageTestIds.LIST_ITEM)
      const statusBadge = within(card).getByTestId(GymCardTestIds.STATUS_BADGE)

      expect(statusBadge).toHaveTextContent('Pending Approval')
      expect(statusBadge).not.toHaveTextContent('Active')
    })

    it('should render without an affiliation section if affiliation data is missing', () => {
      // Arrange
      const gymWithoutAffiliation = {
        ...MOCK_GYM_FULL,
        id: 'gym-no-affiliation',
        affiliation: undefined,
      }
      render(
        <GymCard
          gym={gymWithoutAffiliation}
          data-testid={GymsPageTestIds.LIST_ITEM}
        />
      )
      const card = screen.getByTestId(GymsPageTestIds.LIST_ITEM)

      expect(within(card).getByTestId(GymCardTestIds.NAME)).toBeInTheDocument()
    })
  })

  describe('Image', () => {
    it('should render the gym image with descriptive alt text when imageUrl is present', () => {
      render(
        <GymCard gym={MOCK_GYM_FULL} data-testid={GymsPageTestIds.LIST_ITEM} />
      )
      const card = screen.getByTestId(GymsPageTestIds.LIST_ITEM)
      const img = within(card).getByTestId(GymCardTestIds.IMAGE)

      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute(
        'alt',
        `Exterior or interior of ${MOCK_GYM_FULL.name}`
      )
      expect(
        within(card).queryByTestId(GymCardTestIds.IMAGE_FALLBACK)
      ).not.toBeInTheDocument()
    })

    it('should show the fallback when imageUrl is absent', () => {
      render(
        <GymCard
          gym={MOCK_GYM_MINIMAL}
          data-testid={GymsPageTestIds.LIST_ITEM}
        />
      )
      const card = screen.getByTestId(GymsPageTestIds.LIST_ITEM)

      expect(
        within(card).queryByTestId(GymCardTestIds.IMAGE)
      ).not.toBeInTheDocument()
      expect(
        within(card).getByTestId(GymCardTestIds.IMAGE_FALLBACK)
      ).toBeInTheDocument()
    })

    it('should render the image with a srcSet pointing to thumbnail and full-size URLs', () => {
      render(
        <GymCard gym={MOCK_GYM_FULL} data-testid={GymsPageTestIds.LIST_ITEM} />
      )
      const img = screen.getByTestId(GymCardTestIds.IMAGE)

      expect(img).toHaveAttribute('srcset')
      expect(img.getAttribute('srcset')).toContain(MOCK_GYM_FULL.thumbnailUrl)
      expect(img.getAttribute('srcset')).toContain(MOCK_GYM_FULL.imageUrl)
    })

    it('should show a skeleton while the image has not yet loaded', () => {
      render(
        <GymCard gym={MOCK_GYM_FULL} data-testid={GymsPageTestIds.LIST_ITEM} />
      )
      const card = screen.getByTestId(GymsPageTestIds.LIST_ITEM)

      expect(
        within(card).getByTestId(GymCardTestIds.IMAGE_SKELETON)
      ).toBeInTheDocument()
    })

    it('should hide the skeleton once the image has loaded', () => {
      render(
        <GymCard gym={MOCK_GYM_FULL} data-testid={GymsPageTestIds.LIST_ITEM} />
      )
      const card = screen.getByTestId(GymsPageTestIds.LIST_ITEM)
      const img = within(card).getByTestId(GymCardTestIds.IMAGE)

      fireEvent.load(img)

      expect(
        within(card).queryByTestId(GymCardTestIds.IMAGE_SKELETON)
      ).not.toBeInTheDocument()
    })

    it('should show the fallback and hide the image when the image fails to load', () => {
      render(
        <GymCard gym={MOCK_GYM_FULL} data-testid={GymsPageTestIds.LIST_ITEM} />
      )
      const card = screen.getByTestId(GymsPageTestIds.LIST_ITEM)
      const img = within(card).getByTestId(GymCardTestIds.IMAGE)

      fireEvent.error(img)

      expect(
        within(card).queryByTestId(GymCardTestIds.IMAGE)
      ).not.toBeInTheDocument()
      expect(
        within(card).getByTestId(GymCardTestIds.IMAGE_FALLBACK)
      ).toBeInTheDocument()
    })
  })
})
