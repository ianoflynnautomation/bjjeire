import { MatchersV3 } from '@pact-foundation/pact'
import { describe, expect, it } from 'vitest'
import { createPact } from './pact-setup'

const { like, eachLike, integer, boolean, string } = MatchersV3

describe('Pact - Store consumer contract', () => {
  it('GET /api/v1/store returns a paged response of stores', async () => {
    const pact = createPact()

    await pact
      .addInteraction()
      .given('stores exist')
      .uponReceiving('a request for the stores list')
      .withRequest('GET', '/api/v1/store', builder => {
        builder.query({ page: '1', pageSize: '25' })
      })
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody({
          data: eachLike({
            id: string(),
            name: string(),
            websiteUrl: string(),
            isActive: boolean(),
          }),
          pagination: like({
            totalItems: integer(),
            currentPage: integer(1),
            pageSize: integer(5),
            totalPages: integer(),
            hasNextPage: boolean(),
            hasPreviousPage: boolean(false),
          }),
        })
      })
      .executeTest(async mockServer => {
        const response = await fetch(
          `${mockServer.url}/api/v1/store?page=1&pageSize=25`
        )
        expect(response.ok).toBe(true)

        const body = (await response.json()) as {
          data: unknown[]
          pagination: { currentPage: unknown }
        }
        expect(body.data.length).toBeGreaterThan(0)
        expect(body.pagination.currentPage).toBe(1)
      })
  })
})
