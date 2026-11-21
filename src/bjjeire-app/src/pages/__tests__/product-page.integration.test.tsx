import { screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { ProductPageTestIds } from '@/constants/merchDataTestIds'
import {
  renderProductPage,
  seedProduct,
  seedProductStatus,
} from '@/features/merch/testing/merch-test-helpers'
import { createProduct, photoHash } from '@/testing/factories/product.factory'
import type { ProductDto } from '@/types/products'

const { merch } = uiContent

function rashguard(overrides: Partial<ProductDto> = {}): ProductDto {
  return createProduct({
    slug: 'harp-rashguard',
    name: 'Harp Rashguard',
    kind: 'RASHGUARD',
    description: 'Long sleeve, sublimated harp.',
    priceCents: 4500,
    photos: [photoHash(1), photoHash(2)],
    sizes: [
      { id: 'S', available: 3, soldOut: false },
      { id: 'M', available: 2, soldOut: false },
      { id: 'L', available: 1, soldOut: false },
      { id: 'XL', available: 0, soldOut: true },
    ],
    ...overrides,
  })
}

describe('ProductPage', () => {
  // #6002
  it('given a published product, when a visitor opens it, then they see its photos, description, price and every size it comes in', async () => {
    seedProduct(rashguard())
    renderProductPage('harp-rashguard')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Harp Rashguard' })
    ).toBeInTheDocument()
    expect(screen.getByTestId(ProductPageTestIds.KIND)).toHaveTextContent(
      merch.kinds.RASHGUARD
    )
    expect(screen.getByTestId(ProductPageTestIds.PRICE)).toHaveTextContent(
      '€45.00'
    )
    expect(
      screen.getByTestId(ProductPageTestIds.DESCRIPTION)
    ).toHaveTextContent('Long sleeve, sublimated harp.')

    const photos = within(
      screen.getByTestId(ProductPageTestIds.PHOTOS)
    ).getAllByTestId(ProductPageTestIds.PHOTO)
    expect(photos).toHaveLength(2)
    expect(photos[0].getAttribute('src')).toMatch(
      new RegExp(`/api/v1/product/photo/${photoHash(1)}$`)
    )
    expect(photos[0]).toHaveAttribute('alt', 'Harp Rashguard, photo 1 of 2')

    const sizes = within(
      screen.getByTestId(ProductPageTestIds.SIZES)
    ).getAllByTestId(ProductPageTestIds.SIZE)
    expect(sizes.map(size => size.textContent)).toEqual([
      'S',
      'M',
      'L',
      expect.stringContaining('XL'),
    ])
  })

  // #6002
  it('given a sold-out size, when a visitor looks at the sizes, then it is shown, marked sold out and cannot be chosen, and the other sizes can', async () => {
    seedProduct(rashguard())
    const { user } = renderProductPage('harp-rashguard')

    const xl = await screen.findByRole('radio', {
      name: merch.product.soldOutSize('XL'),
    })
    expect(xl).toBeDisabled()
    expect(screen.getByText(merch.product.soldOut)).toBeInTheDocument()

    const medium = screen.getByRole('radio', { name: 'M' })
    expect(medium).toBeEnabled()
    await user.click(medium)
    expect(medium).toBeChecked()
    await user.click(xl)
    expect(xl).not.toBeChecked()
  })

  // #6002
  it('given every size is sold out, when a visitor opens the product, then it says so and no size can be chosen', async () => {
    seedProduct(
      rashguard({
        soldOut: true,
        sizes: [
          { id: 'S', available: 0, soldOut: true },
          { id: 'M', available: 0, soldOut: true },
        ],
      })
    )
    renderProductPage('harp-rashguard')

    expect(
      await screen.findByText(merch.product.allSoldOut)
    ).toBeInTheDocument()
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
  })

  // #6002
  it('given an unknown, draft or hidden product, when a visitor opens its address, then it says "Product not found" with a link back to Shop', async () => {
    seedProductStatus('gone', 404)
    renderProductPage('gone')

    const notFound = await screen.findByTestId(ProductPageTestIds.NOT_FOUND)
    expect(
      within(notFound).getByRole('heading', { name: merch.notFound.title })
    ).toBeInTheDocument()
    expect(
      within(notFound).getByRole('link', { name: merch.notFound.backLink })
    ).toHaveAttribute('href', paths.shop.getHref())
  })

  it('given the API fails, when a visitor opens the page, then a retry is offered', async () => {
    seedProductStatus('harp-rashguard', 500)
    renderProductPage('harp-rashguard')

    expect(
      await screen.findByRole('button', { name: /retry/i })
    ).toBeInTheDocument()
  })

  // ADR-0011: the page never changes the visitor's theme.
  it.each(['light', 'dark', 'competition'] as const)(
    'given the %s theme is chosen, when a visitor opens a product page, then it renders and the chosen theme is kept',
    async theme => {
      localStorage.setItem('bjjeire-theme', theme)
      const classes = document.documentElement.className
      seedProduct(rashguard())
      renderProductPage('harp-rashguard')

      expect(
        await screen.findByTestId(ProductPageTestIds.NAME)
      ).toBeInTheDocument()
      expect(localStorage.getItem('bjjeire-theme')).toBe(theme)
      expect(document.documentElement.className).toBe(classes)
      localStorage.removeItem('bjjeire-theme')
    }
  )
})
