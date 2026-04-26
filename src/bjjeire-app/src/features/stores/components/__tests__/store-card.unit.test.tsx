import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StoreCard } from '../store-card/store-card'
import {
  StoresPageTestIds,
  StoresCardTestIds,
} from '@/constants/storeDataTestIds'
import { createStore } from '@/testing/factories/store.factory'
import { uiContent } from '@/config/ui-content'

const { card } = uiContent.stores

const FULL_STORE = createStore({
  id: 'store-full',
  name: 'Tatami Fightwear',
  description: 'Premium BJJ gi and apparel brand.',
  websiteUrl: 'https://tatamifightwear.com',
  logoUrl: 'https://example.com/tatami-logo.png',
})

const MINIMAL_STORE = createStore({
  id: 'store-minimal',
  name: 'No Website Store',
  description: undefined,
  websiteUrl: '',
  logoUrl: undefined,
})

const NO_NAME_STORE = createStore({
  id: 'store-no-name',
  name: '',
  websiteUrl: 'https://example.com',
})

describe('StoreCard', () => {
  describe('full data', () => {
    it('renders name, description, and website link', () => {
      render(
        <StoreCard
          store={FULL_STORE}
          data-testid={StoresPageTestIds.LIST_ITEM}
        />
      )

      const cardEl = screen.getByTestId(StoresPageTestIds.LIST_ITEM)

      expect(
        within(cardEl).getByTestId(StoresCardTestIds.NAME)
      ).toHaveTextContent('Tatami Fightwear')
      expect(
        within(cardEl).getByTestId(StoresCardTestIds.DESCRIPTION)
      ).toHaveTextContent('Premium BJJ gi and apparel brand.')

      const websiteLink = within(cardEl).getByTestId(
        StoresCardTestIds.WEBSITE_BUTTON
      )
      expect(websiteLink.tagName).toBe('A')
      expect(websiteLink).toHaveAttribute('href', 'https://tatamifightwear.com')
      expect(websiteLink).toHaveTextContent(card.visitWebsiteButton)
    })
  })

  describe('minimal data', () => {
    it('hides description and disables website button when data is missing', () => {
      render(
        <StoreCard
          store={MINIMAL_STORE}
          data-testid={StoresPageTestIds.LIST_ITEM}
        />
      )

      const cardEl = screen.getByTestId(StoresPageTestIds.LIST_ITEM)

      expect(
        within(cardEl).getByTestId(StoresCardTestIds.NAME)
      ).toHaveTextContent('No Website Store')
      expect(
        within(cardEl).queryByTestId(StoresCardTestIds.DESCRIPTION)
      ).not.toBeInTheDocument()

      const websiteButton = within(cardEl).getByTestId(
        StoresCardTestIds.WEBSITE_BUTTON
      )
      expect(websiteButton.tagName).toBe('BUTTON')
      expect(websiteButton).toBeDisabled()
      expect(websiteButton).toHaveTextContent(card.noWebsiteButton)
    })
  })

  describe('edge cases', () => {
    it('shows fallback name when name is empty', () => {
      render(
        <StoreCard
          store={NO_NAME_STORE}
          data-testid={StoresPageTestIds.LIST_ITEM}
        />
      )

      expect(screen.getByTestId(StoresCardTestIds.NAME)).toHaveTextContent(
        card.fallbackName
      )
    })

    it('uses the default test ID when data-testid is not provided', () => {
      render(<StoreCard store={FULL_STORE} />)

      expect(
        screen.getByTestId(StoresPageTestIds.LIST_ITEM)
      ).toBeInTheDocument()
    })

    it('sets aria-labelledby linking to the heading', () => {
      render(
        <StoreCard
          store={FULL_STORE}
          data-testid={StoresPageTestIds.LIST_ITEM}
        />
      )

      const cardEl = screen.getByTestId(StoresPageTestIds.LIST_ITEM)
      const headingId = cardEl.getAttribute('aria-labelledby')
      expect(headingId).toBeTruthy()

      const heading = within(cardEl).getByRole('heading', { level: 3 })
      expect(heading.id).toBe(headingId)
    })
  })
})
