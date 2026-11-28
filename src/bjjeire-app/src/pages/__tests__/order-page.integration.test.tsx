import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { OrderPageTestIds } from '@/constants/merchDataTestIds'
import {
  captureResumeCheckout,
  ORDERS_API,
  problem,
  renderShopRoute,
  seedOrder,
} from '@/features/merch/testing/order-test-helpers'
import { addToBasket, readBasket } from '@/features/merch/utils/basket'
import {
  orderKeyStorageKey,
  shouldKeepPolling,
  MAX_POLLS,
} from '@/features/merch/utils/order-key'
import { server } from '@/testing/msw/server'
import {
  createOrder,
  createOrderCheckout,
} from '@/testing/factories/order.factory'

const { order: copy } = uiContent.merch
const KEY = 'k3y_from-the-link'

const assign = vi.fn<(url: string) => void>()

describe('OrderPage (#6011)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.stubGlobal('location', { href: window.location.href, assign })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    assign.mockReset()
  })

  // #6011
  it('given the link from the confirmation email, when the shopper follows it, then the key is read from the fragment and sent as X-Order-Key', async () => {
    const order = createOrder()
    const reads = seedOrder(KEY, order)

    renderShopRoute(`${paths.order.getHref(order.id)}#key=${KEY}`)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: copy.title('BJE-20261123-ABCDEF'),
      })
    ).toBeInTheDocument()
    expect(reads.keys()).toEqual([KEY])
    expect(screen.getByTestId(OrderPageTestIds.STATUS)).toHaveTextContent(
      copy.statuses.CONFIRMED
    )
    const [line] = screen.getAllByTestId(OrderPageTestIds.LINE)
    expect(line).toHaveTextContent('Harp Rashguard')
    expect(line).toHaveTextContent(copy.size('M'))
    expect(line).toHaveTextContent(copy.quantity(2))
    expect(line).toHaveTextContent('€90.00')
    expect(screen.getByTestId(OrderPageTestIds.ITEMS)).toHaveTextContent(
      '€90.00'
    )
    expect(screen.getByTestId(OrderPageTestIds.DELIVERY)).toHaveTextContent(
      '€6.50'
    )
    expect(screen.getByTestId(OrderPageTestIds.TOTAL)).toHaveTextContent(
      '€96.50'
    )
    const address = screen.getByTestId(OrderPageTestIds.ADDRESS)
    expect(address).toHaveTextContent('Aoife Byrne')
    expect(address).toHaveTextContent('1 Shop Street')
    expect(address).toHaveTextContent('H91 E2K3')
  })

  // #6007 #6011
  it('given the return from Stripe, when the order is still being confirmed, then the page asks again until it is confirmed and empties the basket', async () => {
    const awaiting = createOrder({ status: 'AWAITING_PAYMENT', paidAt: null })
    const confirmed = { ...awaiting, status: 'CONFIRMED' as const }
    sessionStorage.setItem(orderKeyStorageKey(awaiting.id), KEY)
    addToBasket('0000000000000000000000a1', 'M', 2, 5)
    const reads = seedOrder(KEY, awaiting, confirmed)

    renderShopRoute(`${paths.order.getHref(awaiting.id)}?checkout=complete`)

    expect(
      await screen.findByTestId(OrderPageTestIds.MESSAGE)
    ).toHaveTextContent(copy.confirming)
    await waitFor(
      () =>
        expect(screen.getByTestId(OrderPageTestIds.STATUS)).toHaveTextContent(
          copy.statuses.CONFIRMED
        ),
      { timeout: 4000 }
    )
    expect(screen.getByTestId(OrderPageTestIds.MESSAGE)).toHaveTextContent(
      copy.confirmed
    )
    expect(reads.reads()).toBeGreaterThanOrEqual(2)
    expect(readBasket()).toEqual([])
  })

  // #6007
  it('given the polling rule, when it is asked, then it polls only after the return from Stripe, while awaiting payment, and at most 30 times', () => {
    expect(MAX_POLLS).toBe(30)
    expect(shouldKeepPolling('AWAITING_PAYMENT', 1, true)).toBe(true)
    expect(shouldKeepPolling('AWAITING_PAYMENT', MAX_POLLS, true)).toBe(false)
    expect(shouldKeepPolling('AWAITING_PAYMENT', 1, false)).toBe(false)
    expect(shouldKeepPolling('CONFIRMED', 1, true)).toBe(false)
  })

  // #6008
  it('given an order that was not paid in time, when the shopper opens it, then they are told nothing was charged and can try again from the basket', async () => {
    const order = createOrder({ status: 'EXPIRED', paidAt: null })
    seedOrder(KEY, order)

    renderShopRoute(`${paths.order.getHref(order.id)}#key=${KEY}`)

    expect(
      await screen.findByTestId(OrderPageTestIds.MESSAGE)
    ).toHaveTextContent(copy.expired)
    expect(screen.getByRole('link', { name: copy.tryAgain })).toHaveAttribute(
      'href',
      paths.basket.getHref()
    )
  })

  // #6008
  it('given an order still waiting for payment, when the shopper returns to payment, then they go back to the open Stripe page', async () => {
    const order = createOrder({
      status: 'AWAITING_PAYMENT',
      paidAt: null,
      holdExpiresAt: '2026-11-23T10:30:00Z',
    })
    seedOrder(KEY, order)
    const resumed = captureResumeCheckout(order.id, () => ({
      status: 200,
      body: { ...createOrderCheckout({ orderId: order.id, orderKey: null }) },
    }))
    const { user } = renderShopRoute(
      `${paths.order.getHref(order.id)}?checkout=cancelled#key=${KEY}`
    )

    await user.click(await screen.findByTestId(OrderPageTestIds.RESUME))

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith(
        'https://checkout.stripe.com/c/pay/cs_test_shop_1'
      )
    )
    expect(resumed.keys()).toEqual([KEY])
  })

  // #6008
  it('given the hold ended meanwhile, when the shopper returns to payment, then they are told and stay', async () => {
    const order = createOrder({ status: 'AWAITING_PAYMENT', paidAt: null })
    seedOrder(KEY, order)
    captureResumeCheckout(order.id, problem(409, 'urn:bjjeire:hold-expired'))
    const { user } = renderShopRoute(
      `${paths.order.getHref(order.id)}#key=${KEY}`
    )

    await user.click(await screen.findByTestId(OrderPageTestIds.RESUME))

    expect(await screen.findByTestId(OrderPageTestIds.ERROR)).toHaveTextContent(
      copy.problems['urn:bjjeire:hold-expired']
    )
    expect(assign).not.toHaveBeenCalled()
  })

  // #6011 FR-015
  it.each([
    ['a wrong key', '#key=wrong'],
    ['no key', ''],
  ])(
    'given %s, when the order is opened, then it shows "Order not found"',
    async (_case, fragment) => {
      const order = createOrder()
      seedOrder(KEY, order)

      renderShopRoute(`${paths.order.getHref(order.id)}${fragment}`)

      const notFound = await screen.findByTestId(OrderPageTestIds.NOT_FOUND)
      expect(
        within(notFound).getByRole('heading', { name: copy.notFound.title })
      ).toBeInTheDocument()
    }
  )

  // #6011: a bank app can finish 3-D Secure in another tab, which has no key.
  it('given a shopper returning from Stripe in a tab with no key, when the page opens, then it points them to the link in their email instead of "Order not found"', async () => {
    const order = createOrder({ status: 'AWAITING_PAYMENT', paidAt: null })
    seedOrder(KEY, order)

    renderShopRoute(`${paths.order.getHref(order.id)}?checkout=complete`)

    expect(
      await screen.findByTestId(OrderPageTestIds.NO_KEY)
    ).toHaveTextContent(copy.noKeyAfterPayment)
    expect(screen.queryByTestId(OrderPageTestIds.NOT_FOUND)).toBeNull()
  })

  // #6007 (QA 1): after 30 reads the page says so instead of waiting forever.
  it('given the webhook never arrives, when the page has asked 30 times, then it says the payment is taking longer than usual', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const awaiting = createOrder({ status: 'AWAITING_PAYMENT', paidAt: null })
      sessionStorage.setItem(orderKeyStorageKey(awaiting.id), KEY)
      const reads = seedOrder(KEY, awaiting)

      renderShopRoute(`${paths.order.getHref(awaiting.id)}?checkout=complete`)
      await screen.findByTestId(OrderPageTestIds.MESSAGE)
      for (let poll = 0; poll < MAX_POLLS + 2; poll++) {
        await vi.advanceTimersByTimeAsync(2_000)
      }

      await waitFor(() =>
        expect(screen.getByTestId(OrderPageTestIds.MESSAGE)).toHaveTextContent(
          copy.stillConfirming
        )
      )
      expect(reads.reads()).toBe(MAX_POLLS)
    } finally {
      vi.useRealTimers()
    }
  })

  // #6011 (QA 4): a cut-off link reads as not found, never as a server error.
  it('given a malformed order id, when the page opens, then it shows "Order not found" and asks the API nothing', async () => {
    let requests = 0
    server.use(
      http.get(`${ORDERS_API}/not-an-id`, () => {
        requests += 1
        return HttpResponse.json({}, { status: 400 })
      })
    )

    renderShopRoute(`${paths.order.getHref('not-an-id')}#key=${KEY}`)

    expect(
      await screen.findByTestId(OrderPageTestIds.NOT_FOUND)
    ).toBeInTheDocument()
    expect(requests).toBe(0)
  })

  // #6011 (QA 6): nothing was sent yet for an unpaid order.
  it('given an order still waiting for payment, when the shopper opens it, then it does not claim a receipt was sent', async () => {
    const order = createOrder({ status: 'AWAITING_PAYMENT', paidAt: null })
    seedOrder(KEY, order)

    renderShopRoute(`${paths.order.getHref(order.id)}#key=${KEY}`)

    expect(
      await screen.findByTestId(OrderPageTestIds.ADDRESS)
    ).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(copy.emailLabel, 'u'))).toBeNull()
  })
})
