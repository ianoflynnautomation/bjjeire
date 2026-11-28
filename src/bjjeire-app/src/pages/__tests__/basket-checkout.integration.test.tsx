import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import {
  BasketTestIds,
  CheckoutTestIds,
  ProductPageTestIds,
} from '@/constants/merchDataTestIds'
import {
  captureCreateOrder,
  orderCreated,
  problem,
  renderShopRoute,
  seedCatalogue,
  seedDelivery,
} from '@/features/merch/testing/order-test-helpers'
import { addToBasket, readBasket } from '@/features/merch/utils/basket'
import { orderKeyStorageKey } from '@/features/merch/utils/order-key'
import { createProduct } from '@/testing/factories/product.factory'
import { createOrderCheckout } from '@/testing/factories/order.factory'
import type { ProductDto } from '@/types/products'

const { basket: basketCopy, checkout: copy } = uiContent.merch

const assign = vi.fn<(url: string) => void>()

function harp(overrides: Partial<ProductDto> = {}): ProductDto {
  return createProduct({
    id: '0000000000000000000000a1',
    slug: 'harp-rashguard',
    name: 'Harp Rashguard',
    priceCents: 4500,
    sizes: [
      { id: 'M', available: 5, soldOut: false },
      { id: 'L', available: 1, soldOut: false },
      { id: 'XL', available: 0, soldOut: true },
    ],
    ...overrides,
  })
}

function tee(overrides: Partial<ProductDto> = {}): ProductDto {
  return createProduct({
    id: '0000000000000000000000b2',
    slug: 'harp-tee',
    name: 'Harp Tee',
    kind: 'T_SHIRT',
    priceCents: 2500,
    sizes: [{ id: 'S', available: 4, soldOut: false }],
    ...overrides,
  })
}

async function fillDetails(
  user: ReturnType<typeof renderShopRoute>['user'],
  country: 'IE' | 'GB' = 'IE'
): Promise<void> {
  await user.type(await screen.findByLabelText(copy.name), 'Aoife Byrne')
  await user.type(screen.getByLabelText(copy.email), 'aoife@example.test')
  await user.type(screen.getByLabelText(copy.line1), '1 Shop Street')
  await user.type(screen.getByLabelText(copy.town), 'Galway')
  await user.type(screen.getByLabelText(copy.county), 'Galway')
  if (country === 'GB') {
    await user.selectOptions(screen.getByLabelText(copy.country), 'GB')
    await user.type(screen.getByLabelText(copy.postcodeNi), 'BT1 1AA')
  } else {
    await user.type(screen.getByLabelText(copy.postcodeIe), 'H91 E2K3')
  }
  await user.click(screen.getByLabelText(copy.terms))
}

describe('Basket and checkout (User Story 3)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.stubGlobal('location', { href: window.location.href, assign })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    assign.mockReset()
  })

  // #6005
  it('given a size chosen on a product page, when the shopper adds it, then the basket holds it', async () => {
    seedCatalogue([harp()])
    const { user } = renderShopRoute(paths.product.getHref('harp-rashguard'))

    await user.click(await screen.findByRole('radio', { name: 'M' }))
    await user.click(screen.getByTestId(BasketTestIds.ADD))

    expect(screen.getByTestId(BasketTestIds.ADD_MESSAGE)).toHaveTextContent(
      uiContent.merch.addToBasket.added('M')
    )
    expect(readBasket()).toEqual([
      { productId: '0000000000000000000000a1', sizeId: 'M', quantity: 1 },
    ])
    expect(screen.getByTestId(ProductPageTestIds.ROOT)).toBeInTheDocument()
  })

  // #6005
  it('given no size chosen, when the shopper tries to add, then nothing is added', async () => {
    seedCatalogue([harp()])
    renderShopRoute(paths.product.getHref('harp-rashguard'))

    expect(await screen.findByTestId(BasketTestIds.ADD)).toBeDisabled()
    expect(readBasket()).toEqual([])
  })

  // #6005
  it('given a basket, when the shopper opens it, then each line shows its quantity, item price and line total, and the running total adds up', async () => {
    seedCatalogue([harp(), tee()])
    addToBasket('0000000000000000000000a1', 'M', 2, 5)
    addToBasket('0000000000000000000000b2', 'S', 1, 4)
    renderShopRoute(paths.basket.getHref())

    const lines = await screen.findAllByTestId(BasketTestIds.LINE)
    expect(lines).toHaveLength(2)
    expect(
      within(lines[0]).getByTestId(BasketTestIds.LINE_NAME)
    ).toHaveTextContent('Harp Rashguard')
    expect(
      within(lines[0]).getByTestId(BasketTestIds.LINE_SIZE)
    ).toHaveTextContent(basketCopy.size('M'))
    expect(
      within(lines[0]).getByTestId(BasketTestIds.LINE_PRICE)
    ).toHaveTextContent('€45.00')
    expect(
      within(lines[0]).getByTestId(BasketTestIds.LINE_QUANTITY)
    ).toHaveValue('2')
    expect(
      within(lines[0]).getByTestId(BasketTestIds.LINE_TOTAL)
    ).toHaveTextContent('€90.00')
    expect(screen.getByTestId(BasketTestIds.ITEMS_TOTAL)).toHaveTextContent(
      '€115.00'
    )
  })

  // #6005
  it('given a basket, when the shopper changes a quantity or removes a line, then the basket and its total follow', async () => {
    seedCatalogue([harp(), tee()])
    addToBasket('0000000000000000000000a1', 'M', 2, 5)
    addToBasket('0000000000000000000000b2', 'S', 1, 4)
    const { user } = renderShopRoute(paths.basket.getHref())

    const quantity = await screen.findByRole('combobox', {
      name: basketCopy.quantityLabel('Harp Rashguard', 'M'),
    })
    await user.selectOptions(quantity, '3')
    expect(screen.getByTestId(BasketTestIds.ITEMS_TOTAL)).toHaveTextContent(
      '€160.00'
    )

    await user.click(
      screen.getByRole('button', {
        name: basketCopy.remove('Harp Tee', 'S'),
      })
    )

    await waitFor(() =>
      expect(screen.getAllByTestId(BasketTestIds.LINE)).toHaveLength(1)
    )
    expect(screen.getByTestId(BasketTestIds.ITEMS_TOTAL)).toHaveTextContent(
      '€135.00'
    )
    expect(readBasket()).toEqual([
      { productId: '0000000000000000000000a1', sizeId: 'M', quantity: 3 },
    ])
  })

  // #6005
  it('given a quantity, when the shopper picks it, then it can never exceed what is available', async () => {
    seedCatalogue([harp()])
    addToBasket('0000000000000000000000a1', 'L', 1, 1)
    renderShopRoute(paths.basket.getHref())

    const quantity = await screen.findByRole('combobox', {
      name: basketCopy.quantityLabel('Harp Rashguard', 'L'),
    })
    expect(
      within(quantity)
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual(['1'])
  })

  // #6010
  it('given a line that sold out or went off sale, when the shopper opens the basket, then it is marked and checkout waits until it is removed', async () => {
    seedCatalogue([harp()])
    addToBasket('0000000000000000000000a1', 'XL', 1, 1)
    addToBasket('0000000000000000000000ff', 'M', 1, 1)
    const { user } = renderShopRoute(paths.basket.getHref())

    const problems = await screen.findAllByTestId(BasketTestIds.LINE_PROBLEM)
    expect(problems.map(line => line.textContent)).toEqual([
      basketCopy.soldOut,
      basketCopy.unavailable,
    ])
    expect(screen.queryByTestId(BasketTestIds.CHECKOUT)).not.toBeInTheDocument()
    expect(screen.getByText(basketCopy.fixFirst)).toBeInTheDocument()

    for (const remove of screen.getAllByRole('button', { name: /^Remove/u })) {
      await user.click(remove)
    }
    expect(await screen.findByTestId(BasketTestIds.EMPTY)).toBeInTheDocument()
  })

  // #6006
  it('given a basket, when the shopper goes to pay, then they see the items, the delivery fee and the full amount before paying', async () => {
    seedCatalogue([harp()])
    seedDelivery(650)
    addToBasket('0000000000000000000000a1', 'M', 2, 5)
    renderShopRoute(paths.checkout.getHref())

    expect(await screen.findByTestId(CheckoutTestIds.ITEMS)).toHaveTextContent(
      '€90.00'
    )
    expect(
      await screen.findByTestId(CheckoutTestIds.DELIVERY)
    ).toHaveTextContent('€6.50')
    expect(screen.getByTestId(CheckoutTestIds.TOTAL)).toHaveTextContent(
      '€96.50'
    )
    expect(screen.getByTestId(CheckoutTestIds.SUBMIT)).toHaveTextContent(
      copy.submit('€96.50')
    )
  })

  // #6006 #6012
  it('given the delivery details, when the shopper pays as a guest, then the order is sent with the prices they saw and they leave for Stripe', async () => {
    seedCatalogue([harp()])
    seedDelivery(650)
    addToBasket('0000000000000000000000a1', 'M', 2, 5)
    const checkout = createOrderCheckout({ orderKey: 'the-key' })
    const orders = captureCreateOrder(orderCreated(checkout))
    const { user } = renderShopRoute(paths.checkout.getHref())

    await fillDetails(user)
    await user.click(await screen.findByTestId(CheckoutTestIds.SUBMIT))

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith(checkout.checkoutUrl)
    )
    expect(orders.bodies()).toEqual([
      {
        lines: [
          {
            productId: '0000000000000000000000a1',
            sizeId: 'M',
            quantity: 2,
            unitPriceCents: 4500,
          },
        ],
        email: 'aoife@example.test',
        address: {
          name: 'Aoife Byrne',
          line1: '1 Shop Street',
          line2: null,
          town: 'Galway',
          county: 'Galway',
          postcode: 'H91 E2K3',
          country: 'IE',
          phone: null,
        },
        deliveryCents: 650,
        acceptTerms: true,
      },
    ])
    expect(orders.authorizations()).toEqual([null])
    expect(sessionStorage.getItem(orderKeyStorageKey(checkout.orderId))).toBe(
      'the-key'
    )
  })

  // #6012
  it('given a guest, when they check out, then they are never asked to sign in or create an account', async () => {
    seedCatalogue([harp()])
    seedDelivery(650)
    addToBasket('0000000000000000000000a1', 'M', 1, 5)
    renderShopRoute(paths.checkout.getHref())

    expect(await screen.findByTestId(CheckoutTestIds.FORM)).toBeInTheDocument()
    expect(screen.getByText(copy.guestNote)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign in/iu })).toBeNull()
    expect(screen.queryByText(/password/iu)).toBeNull()
  })

  // #6006
  it('given Northern Ireland, when the shopper picks it, then they are asked for a BT postcode', async () => {
    seedCatalogue([harp()])
    seedDelivery(650)
    addToBasket('0000000000000000000000a1', 'M', 1, 5)
    const orders = captureCreateOrder(orderCreated(createOrderCheckout()))
    const { user } = renderShopRoute(paths.checkout.getHref())

    await user.selectOptions(await screen.findByLabelText(copy.country), 'GB')

    expect(screen.getByText(copy.postcodeNiHint)).toBeInTheDocument()
    expect(screen.queryByLabelText(copy.postcodeIe)).toBeNull()

    await user.type(screen.getByLabelText(copy.postcodeNi), 'SW1A 1AA')
    await user.click(screen.getByTestId(CheckoutTestIds.SUBMIT))

    expect(
      await screen.findByText(copy.validation.postcodeNi)
    ).toBeInTheDocument()
    expect(orders.bodies()).toEqual([])
  })

  // #6006
  it('given a missing detail, when the shopper pays, then the form says what is missing and sends nothing', async () => {
    seedCatalogue([harp()])
    seedDelivery(650)
    addToBasket('0000000000000000000000a1', 'M', 1, 5)
    const orders = captureCreateOrder(orderCreated(createOrderCheckout()))
    const { user } = renderShopRoute(paths.checkout.getHref())

    await user.click(await screen.findByTestId(CheckoutTestIds.SUBMIT))

    expect(await screen.findByText(copy.validation.name)).toBeInTheDocument()
    expect(screen.getByText(copy.validation.email)).toBeInTheDocument()
    expect(screen.getByText(copy.validation.terms)).toBeInTheDocument()
    expect(orders.bodies()).toEqual([])
  })

  // #6010
  it('given the basket changed since it was filled, when the shopper pays, then each change is listed and the basket is updated', async () => {
    seedCatalogue([harp(), tee()])
    seedDelivery(650)
    addToBasket('0000000000000000000000a1', 'M', 3, 5)
    addToBasket('0000000000000000000000a1', 'L', 1, 1)
    addToBasket('0000000000000000000000b2', 'S', 1, 4)
    captureCreateOrder(
      problem(409, 'urn:bjjeire:basket-changed', {
        lines: [
          {
            productId: '0000000000000000000000a1',
            sizeId: 'M',
            reason: 'SOLD_OUT',
            nowAvailable: 2,
          },
          {
            productId: '0000000000000000000000a1',
            sizeId: 'L',
            reason: 'UNAVAILABLE',
          },
          {
            productId: '0000000000000000000000b2',
            sizeId: 'S',
            reason: 'PRICE_CHANGED',
            nowPriceCents: 3000,
          },
        ],
        nowDeliveryCents: 700,
      })
    )
    const { user } = renderShopRoute(paths.checkout.getHref())

    await fillDetails(user)
    await user.click(screen.getByTestId(CheckoutTestIds.SUBMIT))

    const changes = await screen.findAllByTestId(CheckoutTestIds.CHANGE)
    expect(changes.map(change => change.textContent)).toEqual([
      copy.changes.SOLD_OUT('Harp Rashguard', 'M', 2),
      copy.changes.UNAVAILABLE('Harp Rashguard', 'L'),
      copy.changes.PRICE_CHANGED('Harp Tee', 'S', '€30.00'),
      copy.changes.delivery('€7.00'),
    ])
    expect(readBasket()).toEqual([
      { productId: '0000000000000000000000a1', sizeId: 'M', quantity: 2 },
      { productId: '0000000000000000000000b2', sizeId: 'S', quantity: 1 },
    ])
    expect(assign).not.toHaveBeenCalled()
  })

  it('given the API refuses for another reason, when the shopper pays, then they are told why and stay on the page', async () => {
    seedCatalogue([harp()])
    seedDelivery(650)
    addToBasket('0000000000000000000000a1', 'M', 1, 5)
    captureCreateOrder(problem(409, 'urn:bjjeire:delivery-not-available'))
    const { user } = renderShopRoute(paths.checkout.getHref())

    await fillDetails(user)
    await user.click(screen.getByTestId(CheckoutTestIds.SUBMIT))

    expect(await screen.findByTestId(CheckoutTestIds.ERROR)).toHaveTextContent(
      copy.problems['urn:bjjeire:delivery-not-available']
    )
    expect(assign).not.toHaveBeenCalled()
  })

  it('given a checkout address that is not Stripe, when the order is made, then the shopper is not sent there', async () => {
    seedCatalogue([harp()])
    seedDelivery(650)
    addToBasket('0000000000000000000000a1', 'M', 1, 5)
    captureCreateOrder(
      orderCreated(
        createOrderCheckout({ checkoutUrl: 'https://evil.example/pay' })
      )
    )
    const { user } = renderShopRoute(paths.checkout.getHref())

    await fillDetails(user)
    await user.click(screen.getByTestId(CheckoutTestIds.SUBMIT))

    expect(await screen.findByTestId(CheckoutTestIds.ERROR)).toHaveTextContent(
      copy.problems.fallback
    )
    expect(assign).not.toHaveBeenCalled()
  })

  it('given an empty basket, when the shopper opens checkout, then there is nothing to pay for', async () => {
    seedCatalogue([])
    seedDelivery(650)
    renderShopRoute(paths.checkout.getHref())

    expect(await screen.findByTestId(CheckoutTestIds.EMPTY)).toHaveTextContent(
      copy.empty
    )
    expect(screen.queryByTestId(CheckoutTestIds.FORM)).toBeNull()
  })

  // #6005 #6010 (QA 3): a line that now asks for more than is left shows its real quantity and how to fix it.
  it('given a line holding more than is now available, when the shopper opens the basket, then it shows the quantity held and asks for a lower one', async () => {
    seedCatalogue([harp()])
    localStorage.setItem(
      'bjjeire-basket',
      JSON.stringify([
        { productId: '0000000000000000000000a1', sizeId: 'L', quantity: 3 },
      ])
    )
    const { user } = renderShopRoute(paths.basket.getHref())

    const quantity = await screen.findByRole('combobox', {
      name: basketCopy.quantityLabel('Harp Rashguard', 'L'),
    })
    expect(quantity).toHaveValue('3')
    expect(screen.getByTestId(BasketTestIds.LINE_PROBLEM)).toHaveTextContent(
      basketCopy.fewerLeft(1)
    )
    expect(screen.getByText(basketCopy.lowerFirst)).toBeInTheDocument()
    expect(screen.queryByText(basketCopy.fixFirst)).toBeNull()

    await user.selectOptions(quantity, '1')

    expect(
      await screen.findByTestId(BasketTestIds.CHECKOUT)
    ).toBeInTheDocument()
  })

  // #6005 (QA 8): the 20-item cap is named as such.
  it('given a full basket, when the shopper adds another size, then they are told the basket holds 20 items at most', async () => {
    seedCatalogue([harp()])
    localStorage.setItem(
      'bjjeire-basket',
      JSON.stringify([
        { productId: '0000000000000000000000b2', sizeId: 'S', quantity: 10 },
        { productId: '0000000000000000000000c3', sizeId: 'M', quantity: 10 },
      ])
    )
    const { user } = renderShopRoute(paths.product.getHref('harp-rashguard'))

    await user.click(await screen.findByRole('radio', { name: 'M' }))
    await user.click(screen.getByTestId(BasketTestIds.ADD))

    expect(screen.getByTestId(BasketTestIds.ADD_MESSAGE)).toHaveTextContent(
      uiContent.merch.addToBasket.basketFull
    )
  })
})
