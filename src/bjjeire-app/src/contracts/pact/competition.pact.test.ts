import { MatchersV3 } from '@pact-foundation/pact'
import { describe, expect, it } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { createPact } from './pact-setup'

const { like, eachLike, integer, boolean, string } = MatchersV3

describe('Pact - Competition consumer contract', () => {
  it('GET /api/v1/competition returns a paged response of competitions', async () => {
    const pact = createPact()

    await pact
      .addInteraction()
      .given('competitions exist')
      .uponReceiving('a request for the competitions list')
      .withRequest('GET', API_ROUTES.competitions, builder => {
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
            pageSize: integer(25),
            totalPages: integer(),
            hasNextPage: boolean(),
            hasPreviousPage: boolean(false),
          }),
        })
      })
      .executeTest(async mockServer => {
        const response = await fetch(
          `${mockServer.url}${API_ROUTES.competitions}?page=1&pageSize=25`
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
