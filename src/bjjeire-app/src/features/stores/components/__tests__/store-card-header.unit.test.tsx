import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StoreCardHeader } from '../store-card/store-card-header'
import { StoresCardTestIds } from '@/constants/storeDataTestIds'
import { uiContent } from '@/config/ui-content'

const { card } = uiContent.stores

describe('StoreCardHeader', () => {
  it('given a logo URL, when the header renders, then the logo is shown with descriptive alt text', () => {
    render(
      <StoreCardHeader name="Tatami" logoUrl="https://example.com/logo.png" />
    )

    const img = screen.getByTestId(StoresCardTestIds.LOGO)
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('alt', `${card.logoAlt} Tatami`)
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png')
  })

  it('given the logo has not yet loaded, when the header renders, then a skeleton is shown', () => {
    render(
      <StoreCardHeader name="Tatami" logoUrl="https://example.com/logo.png" />
    )

    expect(
      screen.getByTestId(StoresCardTestIds.LOGO_SKELETON)
    ).toBeInTheDocument()
  })

  it('given a visible skeleton, when the logo finishes loading, then the skeleton is removed', () => {
    render(
      <StoreCardHeader name="Tatami" logoUrl="https://example.com/logo.png" />
    )

    fireEvent.load(screen.getByTestId(StoresCardTestIds.LOGO))

    expect(
      screen.queryByTestId(StoresCardTestIds.LOGO_SKELETON)
    ).not.toBeInTheDocument()
  })

  it('given a rendered logo, when it fails to load, then the fallback icon replaces it', () => {
    render(
      <StoreCardHeader name="Tatami" logoUrl="https://example.com/logo.png" />
    )

    fireEvent.error(screen.getByTestId(StoresCardTestIds.LOGO))

    expect(screen.queryByTestId(StoresCardTestIds.LOGO)).not.toBeInTheDocument()
    expect(
      screen.getByTestId(StoresCardTestIds.LOGO_FALLBACK)
    ).toBeInTheDocument()
  })

  it.each([
    { logoUrl: null, case: 'null' },
    { logoUrl: undefined, case: 'undefined' },
  ])(
    'given a $case logo URL, when the header renders, then the fallback icon is shown',
    ({ logoUrl }) => {
      render(<StoreCardHeader name="No Logo Store" logoUrl={logoUrl} />)

      expect(
        screen.queryByTestId(StoresCardTestIds.LOGO)
      ).not.toBeInTheDocument()
      expect(
        screen.getByTestId(StoresCardTestIds.LOGO_FALLBACK)
      ).toBeInTheDocument()
    }
  )
})
