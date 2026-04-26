import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StoreCardHeader } from '../store-card/store-card-header'
import { StoresCardTestIds } from '@/constants/storeDataTestIds'
import { uiContent } from '@/config/ui-content'

const { card } = uiContent.stores

describe('StoreCardHeader', () => {
  describe('with logo', () => {
    it('renders the logo image with correct alt text', () => {
      render(
        <StoreCardHeader name="Tatami" logoUrl="https://example.com/logo.png" />
      )

      const img = screen.getByTestId(StoresCardTestIds.LOGO)
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('alt', `${card.logoAlt} Tatami`)
      expect(img).toHaveAttribute('src', 'https://example.com/logo.png')
    })

    it('shows skeleton while image has not loaded', () => {
      render(
        <StoreCardHeader name="Tatami" logoUrl="https://example.com/logo.png" />
      )

      expect(
        screen.getByTestId(StoresCardTestIds.LOGO_SKELETON)
      ).toBeInTheDocument()
    })

    it('hides skeleton once image has loaded', () => {
      render(
        <StoreCardHeader name="Tatami" logoUrl="https://example.com/logo.png" />
      )

      fireEvent.load(screen.getByTestId(StoresCardTestIds.LOGO))

      expect(
        screen.queryByTestId(StoresCardTestIds.LOGO_SKELETON)
      ).not.toBeInTheDocument()
    })

    it('shows fallback when image fails to load', () => {
      render(
        <StoreCardHeader name="Tatami" logoUrl="https://example.com/logo.png" />
      )

      fireEvent.error(screen.getByTestId(StoresCardTestIds.LOGO))

      expect(
        screen.queryByTestId(StoresCardTestIds.LOGO)
      ).not.toBeInTheDocument()
      expect(
        screen.getByTestId(StoresCardTestIds.LOGO_FALLBACK)
      ).toBeInTheDocument()
    })
  })

  describe('without logo', () => {
    it('renders the fallback icon when logoUrl is null', () => {
      render(<StoreCardHeader name="No Logo Store" logoUrl={null} />)

      expect(
        screen.queryByTestId(StoresCardTestIds.LOGO)
      ).not.toBeInTheDocument()
      expect(
        screen.getByTestId(StoresCardTestIds.LOGO_FALLBACK)
      ).toBeInTheDocument()
    })

    it('renders the fallback icon when logoUrl is undefined', () => {
      render(<StoreCardHeader name="No Logo Store" />)

      expect(
        screen.getByTestId(StoresCardTestIds.LOGO_FALLBACK)
      ).toBeInTheDocument()
    })
  })
})
