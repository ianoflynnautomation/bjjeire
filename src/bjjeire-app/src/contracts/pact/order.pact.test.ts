import { MatchersV3 } from '@pact-foundation/pact'
import { describe, expect, it } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { createPact } from './pact-setup'

const { like, eachLike, integer, string, regex } = MatchersV3

// Ids and the key are fixed by the provider states in PactProviderVerificationIT.
const PRODUCT_ID = '0123456789abcdef0123dddd'
const ORDER_ID = '0123456789abcdef0123ffff'
const ORDER_KEY = 'pact-order-key'

const SIZE = regex('^(XS|S|M|L|XL|XXL)$', 'M')
const KIND = regex('^(RASHGUARD|SHORTS|T_SHIRT)$', 'RASHGUARD')
const STATUS = regex(
  '^(AWAITING_PAYMENT|CONFIRMED|DISPATCHED|EXPIRED|REFUNDED)$',
  'CONFIRMED'
)
const INSTANT = regex(
  String.raw`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$`,
  '2026-05-31T00:30:00Z'
)

describe('Pact - Order consumer contract', () => {
  // #6006: the checkout shows the flat fee before paying.
  it('GET /api/v1/order/delivery returns the delivery fee and where BJJ Éire delivers', async () => {
    const pact = createPact()

    await pact
      .addInteraction()
      .given('the shop charges for delivery')
      .uponReceiving('a request for the delivery fee')
      .withRequest('GET', `${API_ROUTES.orders}/delivery`)
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody({
          deliveryFeeCents: integer(650),
          currency: string('EUR'),
          countries: eachLike(string('IE')),
        })
      })
      .executeTest(async mockServer => {
        const response = await fetch(
          `${mockServer.url}${API_ROUTES.orders}/delivery`
        )
        expect(response.ok).toBe(true)
      })
  })

  // #6005 #6006 #6012: a guest checkout, with no token.
  it('POST /api/v1/order holds the basket and returns the Stripe Checkout page and the order key', async () => {
    const pact = createPact()
    const command = {
      lines: [
        {
          productId: PRODUCT_ID,
          sizeId: 'M',
          quantity: 1,
          unitPriceCents: 4500,
        },
      ],
      email: 'pact@example.test',
      address: {
        name: 'Pact Shopper',
        line1: '1 Shop Street',
        line2: null,
        town: 'Galway',
        county: 'Galway',
        postcode: 'H91 E2K3',
        country: 'IE',
        phone: null,
      },
      deliveryCents: 0,
      acceptTerms: true,
    }

    await pact
      .addInteraction()
      .given('a published product exists')
      .uponReceiving('a guest checkout')
      .withRequest('POST', API_ROUTES.orders, builder => {
        builder.headers({ 'Content-Type': 'application/json' })
        builder.jsonBody(command)
      })
      .willRespondWith(201, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody({
          orderId: string(ORDER_ID),
          orderKey: string(ORDER_KEY),
          checkoutUrl: string('https://checkout.stripe.com/c/pay/cs_test_1'),
          holdExpiresAt: INSTANT,
          totalCents: integer(4500),
        })
      })
      .executeTest(async mockServer => {
        const response = await fetch(`${mockServer.url}${API_ROUTES.orders}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(command),
        })
        expect(response.status).toBe(201)
      })
  })

  // #6011: read with the key from the emailed link.
  it('GET /api/v1/order/{id} with X-Order-Key returns the order', async () => {
    const pact = createPact()

    await pact
      .addInteraction()
      .given('a confirmed order exists')
      .uponReceiving('a request for an order with its key')
      .withRequest('GET', `${API_ROUTES.orders}/${ORDER_ID}`, builder => {
        builder.headers({ 'X-Order-Key': ORDER_KEY })
      })
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody({
          id: string(ORDER_ID),
          number: regex('^BJE-\\d{8}-[A-Z2-7]{6}$', 'BJE-20260531-ABCDEF'),
          status: STATUS,
          lines: eachLike({
            productId: string(PRODUCT_ID),
            productName: string('Pact Rashguard'),
            kind: KIND,
            sizeId: SIZE,
            quantity: integer(1),
            unitPriceCents: integer(4500),
            lineCents: integer(4500),
          }),
          itemsCents: integer(4500),
          deliveryCents: integer(650),
          totalCents: integer(5150),
          currency: string('EUR'),
          email: string('pact@example.test'),
          address: like({
            name: string('Pact Shopper'),
            line1: string('1 Shop Street'),
            town: string('Galway'),
            county: string('Galway'),
            country: string('IE'),
          }),
          createdAt: INSTANT,
          paidAt: INSTANT,
        })
      })
      .executeTest(async mockServer => {
        const response = await fetch(
          `${mockServer.url}${API_ROUTES.orders}/${ORDER_ID}`,
          { headers: { 'X-Order-Key': ORDER_KEY } }
        )
        expect(response.ok).toBe(true)
      })
  })
})
