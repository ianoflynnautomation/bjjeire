import { screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { describe, it, expect, vi } from 'vitest'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import {
  MerchCardTestIds,
  MerchFeaturedTestIds,
} from '@/constants/merchDataTestIds'
import { StoresPageTestIds } from '@/constants/storeDataTestIds'
import {
  PRODUCTS_API,
  seedProducts,
  seedProductsError,
  seedProductsPending,
} from '@/features/merch/testing/merch-test-helpers'
import {
  renderShopPage,
  seedStores,
  seedStoresPaged,
} from '@/features/stores/testing/stores-test-helpers'
import {
  createProductSummary,
  photoHash,
} from '@/testing/factories/product.factory'
import {
  createPaginatedStores,
  createStore,
} from '@/testing/factories/store.factory'
import { server } from '@/testing/msw/server'

const { merch } = uiContent
const ON = { Merch: true }

function catalogue(): ReturnType<typeof createProductSummary>[] {
  // The API returns them by kind, then name; the page keeps that order.
  return [
    createProductSummary({
      name: 'Harp Rashguard',
      slug: 'harp-rashguard',
      kind: 'RASHGUARD',
      priceCents: 4500,
      photo: photoHash(7),
    }),
    createProductSummary({
      name: 'Competition Shorts',
      slug: 'competition-shorts',
      kind: 'SHORTS',
      priceCents: 3500,
      soldOut: true,
    }),
  ]
}

async function findSection(): Promise<HTMLElement> {
  return screen.findByTestId(MerchFeaturedTestIds.SECTION)
}

describe('ShopPage: BJJ Éire merch section', () => {
  // #6001
  it('given published products, when a visitor opens Shop, then a "BJJ Éire merch" section above the directory search shows each product with photo, name, kind, euro price and an Out of stock mark when no size is in stock', async () => {
    seedProducts(catalogue())
    seedStores([createStore({ name: 'Grappling Store' })])
    renderShopPage(ON)

    const section = await findSection()
    expect(
      within(section).getByRole('heading', {
        level: 2,
        name: merch.section.title,
      })
    ).toBeInTheDocument()
    const cards = within(section).getAllByTestId(MerchFeaturedTestIds.CARD)
    expect(
      cards.map(
        card => within(card).getByTestId(MerchCardTestIds.NAME).textContent
      )
    ).toEqual(['Harp Rashguard', 'Competition Shorts'])

    const first = within(cards[0])
    expect(first.getByTestId(MerchCardTestIds.KIND)).toHaveTextContent(
      merch.kinds.RASHGUARD
    )
    expect(first.getByTestId(MerchCardTestIds.PRICE)).toHaveTextContent(
      '€45.00'
    )
    const image = first.getByTestId(MerchCardTestIds.IMAGE)
    expect(image.getAttribute('src')).toMatch(
      new RegExp(`/api/v1/product/photo/${photoHash(7)}$`)
    )
    expect(image).toHaveAttribute('alt', 'Harp Rashguard')
    expect(
      first.queryByTestId(MerchCardTestIds.OUT_OF_STOCK)
    ).not.toBeInTheDocument()
    expect(first.getByTestId(MerchCardTestIds.LINK)).toHaveAttribute(
      'href',
      paths.product.getHref('harp-rashguard')
    )

    expect(
      within(cards[1]).getByTestId(MerchCardTestIds.OUT_OF_STOCK)
    ).toHaveTextContent(merch.card.outOfStock)

    const search = await screen.findByTestId(StoresPageTestIds.SEARCH)
    expect(
      section.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(await screen.findByText('Grappling Store')).toBeInTheDocument()
  })

  // #6001: a product saved without a photo yet still has a card.
  it('given a product with no photo, when its card renders, then it shows no broken image', async () => {
    seedProducts([createProductSummary({ name: 'Logo Tee', photo: null })])
    seedStores([])
    renderShopPage(ON)

    const section = await findSection()
    expect(
      within(section).queryByTestId(MerchCardTestIds.IMAGE)
    ).not.toBeInTheDocument()
    expect(within(section).getByText('Logo Tee')).toBeInTheDocument()
  })

  // #6003
  it('given no product is published, when a visitor opens Shop, then there is no merch section and no placeholder, and the directory shows as before', async () => {
    seedProducts([])
    seedStores([createStore({ name: 'Grappling Store' })])
    renderShopPage(ON)

    expect(await screen.findByText('Grappling Store')).toBeInTheDocument()
    expect(
      screen.queryByTestId(MerchFeaturedTestIds.SECTION)
    ).not.toBeInTheDocument()
    expect(screen.queryByText(merch.section.title)).not.toBeInTheDocument()
  })

  // #6026: with Merch off nothing is requested.
  it('given the Merch flag is off, when a visitor opens Shop, then no product is requested and the directory shows as before', async () => {
    const requested = vi.fn()
    server.use(
      http.get(PRODUCTS_API, () => {
        requested()
      })
    )
    seedStores([createStore({ name: 'Grappling Store' })])
    renderShopPage({ Merch: false })

    expect(await screen.findByText('Grappling Store')).toBeInTheDocument()
    expect(
      screen.queryByTestId(MerchFeaturedTestIds.SECTION)
    ).not.toBeInTheDocument()
    expect(requested).not.toHaveBeenCalled()
  })

  // Spec edge case: one feature failing must not hide the other.
  it('given the products request fails, when a visitor opens Shop, then the directory shows and the merch section is left out with no error', async () => {
    seedProductsError()
    seedStores([createStore({ name: 'Grappling Store' })])
    renderShopPage(ON)

    expect(await screen.findByText('Grappling Store')).toBeInTheDocument()
    expect(
      screen.queryByTestId(MerchFeaturedTestIds.SECTION)
    ).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /retry/i })).toHaveLength(0)
  })

  it('given the products request is still loading, when the directory has loaded, then the directory shows without the merch section', async () => {
    seedProductsPending()
    seedStores([createStore({ name: 'Grappling Store' })])
    renderShopPage(ON)

    expect(await screen.findByText('Grappling Store')).toBeInTheDocument()
    expect(
      screen.queryByTestId(MerchFeaturedTestIds.SECTION)
    ).not.toBeInTheDocument()
  })

  // #6004
  it('given the merch section is shown, when the visitor searches the directory for something that matches nothing, then the directory shows its empty state, the merch cards stay, and the products were fetched once', async () => {
    const productRequests: URLSearchParams[] = []
    seedProducts(catalogue())
    // Registered last so it sees each request first, then falls through to the seed.
    server.use(
      http.get(PRODUCTS_API, ({ request }) => {
        productRequests.push(new URL(request.url).searchParams)
      })
    )
    seedStores([createStore({ name: 'Grappling Store' })])
    const { user } = renderShopPage(ON)

    await findSection()
    await screen.findByText('Grappling Store')
    await user.type(screen.getByRole('searchbox'), 'Harp Rashguard')

    const SEARCH_SETTLES = { timeout: 5000 }
    await waitFor(
      () =>
        expect(screen.queryByText('Grappling Store')).not.toBeInTheDocument(),
      SEARCH_SETTLES
    )
    await waitFor(() => {
      expect(
        within(screen.getByTestId(MerchFeaturedTestIds.SECTION)).getAllByTestId(
          MerchFeaturedTestIds.CARD
        )
      ).toHaveLength(2)
    }, SEARCH_SETTLES)
    expect(productRequests).toHaveLength(1)
    expect(productRequests[0].get('page')).toBe('1')
    expect(productRequests[0].get('pageSize')).toBe('100')
  })

  // #6004: paging belongs to the directory.
  it('given the merch section is shown, when the visitor moves to the next directory page, then only the directory changes and the products were fetched once', async () => {
    const productRequests: URLSearchParams[] = []
    seedProducts(catalogue())
    server.use(
      http.get(PRODUCTS_API, ({ request }) => {
        productRequests.push(new URL(request.url).searchParams)
      })
    )
    seedStoresPaged({
      1: createPaginatedStores(
        [createStore({ name: 'Tatami Fightwear' })],
        1,
        2
      ),
      2: createPaginatedStores([createStore({ name: 'Scramble Brand' })], 2, 2),
    })
    const { user } = renderShopPage(ON)

    await findSection()
    expect(await screen.findByText('Tatami Fightwear')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(await screen.findByText('Scramble Brand')).toBeInTheDocument()
    expect(
      within(screen.getByTestId(MerchFeaturedTestIds.SECTION)).getAllByTestId(
        MerchFeaturedTestIds.CARD
      )
    ).toHaveLength(2)
    expect(productRequests).toHaveLength(1)
  })
})
