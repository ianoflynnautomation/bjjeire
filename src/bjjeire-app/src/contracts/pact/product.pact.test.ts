import { MatchersV3 } from '@pact-foundation/pact'
import { describe, expect, it } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { createPact } from './pact-setup'

const { like, eachLike, integer, boolean, string, regex } = MatchersV3

const SHA256 = regex(/^[0-9a-f]{64}$/u.source, 'a'.repeat(64))
const KIND = regex('^(RASHGUARD|SHORTS|T_SHIRT)$', 'RASHGUARD')
const SIZE = regex('^(XS|S|M|L|XL|XXL)$', 'M')

describe('Pact - Product consumer contract', () => {
  // #6001: the merch section reads one page of up to 100.
  it('GET /api/v1/product returns a paged response of published products', async () => {
    const pact = createPact()

    await pact
      .addInteraction()
      .given('a published product exists')
      .uponReceiving('a request for the merch catalogue')
      .withRequest('GET', API_ROUTES.products, builder => {
        builder.query({ page: '1', pageSize: '100' })
      })
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody({
          data: eachLike({
            id: string('0123456789abcdef0123dddd'),
            slug: string('pact-rashguard'),
            name: string('Pact Rashguard'),
            kind: KIND,
            priceCents: integer(4500),
            currency: string('EUR'),
            photo: SHA256,
            soldOut: boolean(false),
          }),
          pagination: like({
            totalItems: integer(),
            currentPage: integer(1),
            pageSize: integer(100),
            totalPages: integer(),
            hasNextPage: boolean(),
            hasPreviousPage: boolean(false),
          }),
        })
      })
      .executeTest(async mockServer => {
        const response = await fetch(
          `${mockServer.url}${API_ROUTES.products}?page=1&pageSize=100`
        )
        expect(response.ok).toBe(true)
        const body = (await response.json()) as { data: unknown[] }
        expect(body.data.length).toBeGreaterThan(0)
      })
  })

  // #6002: sizes carry what can be bought, never the stock or what is held.
  it('GET /api/v1/product/{slug} returns a published product with its sizes', async () => {
    const pact = createPact()

    await pact
      .addInteraction()
      .given('a published product exists')
      .uponReceiving('a request for a product page')
      .withRequest('GET', `${API_ROUTES.products}/pact-rashguard`)
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody({
          id: string('0123456789abcdef0123dddd'),
          slug: string('pact-rashguard'),
          name: string('Pact Rashguard'),
          kind: KIND,
          description: string('Long sleeve.'),
          priceCents: integer(4500),
          currency: string('EUR'),
          photos: eachLike(SHA256),
          sizes: eachLike({
            id: SIZE,
            available: integer(3),
            soldOut: boolean(false),
          }),
          soldOut: boolean(false),
        })
      })
      .executeTest(async mockServer => {
        const response = await fetch(
          `${mockServer.url}${API_ROUTES.products}/pact-rashguard`
        )
        expect(response.ok).toBe(true)
        const body = (await response.json()) as { sizes: unknown[] }
        expect(body.sizes.length).toBeGreaterThan(0)
      })
  })
})
