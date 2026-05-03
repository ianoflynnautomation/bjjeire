import { MatchersV3 } from '@pact-foundation/pact'
import { describe, expect, it } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { createPact } from './pact-setup'

const { like, eachLike, integer, boolean, string } = MatchersV3

describe('Pact - BjjEvent consumer contract', () => {
  it('GET /api/v1/bjjevent returns a paged response of events', async () => {
    const pact = createPact()

    await pact
      .addInteraction()
      .given('bjj events exist')
      .uponReceiving('a request for the bjj events list')
      .withRequest('GET', API_ROUTES.bjjEvents, builder => {
        builder.query({ page: '1', pageSize: '25' })
      })
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody({
          data: eachLike({
            id: string(),
            name: string(),
            type: string(),
            status: string(),
            county: string(),
            organiser: like({ name: string() }),
            location: like({
              address: string(),
              venue: string(),
            }),
            schedule: like({}),
            pricing: like({ type: string() }),
            socialMedia: like({}),
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
          `${mockServer.url}${API_ROUTES.bjjEvents}?page=1&pageSize=25`
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
