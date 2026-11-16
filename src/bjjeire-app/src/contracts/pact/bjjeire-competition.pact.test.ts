import { MatchersV3 } from '@pact-foundation/pact'
import { describe, expect, it } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { createPact } from './pact-setup'

const { like, eachLike, integer, boolean, string, regex } = MatchersV3

const STATE = regex('NOT_OPEN|OPEN|CLOSED|FULL', 'OPEN')
const STATUS = regex('PUBLISHED|FINISHED|CANCELLED', 'PUBLISHED')
const INSTANT = regex(
  String.raw`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$`,
  '2026-06-01T09:00:00Z'
)
const DAY = regex(String.raw`^\d{4}-\d{2}-\d{2}$`, '2026-06-27')

describe('Pact - BJJ Éire competition consumer contract', () => {
  // #3006: the featured section asks for one page of 100 upcoming competitions (research R3, R6).
  it('GET /api/v1/bjjeire-competition returns a paged response of upcoming BJJ Éire competitions', async () => {
    const pact = createPact()

    await pact
      .addInteraction()
      .given('a published competition exists')
      .uponReceiving('a request for the upcoming BJJ Éire competition list')
      .withRequest('GET', API_ROUTES.bjjEireCompetitions, builder => {
        builder.query({ page: '1', pageSize: '100' })
      })
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody({
          data: eachLike({
            id: string(),
            slug: string('pact-competition'),
            name: string(),
            date: DAY,
            entryFeeCents: integer(2500),
            currency: string('EUR'),
            registrationOpensAt: INSTANT,
            registrationClosesAt: INSTANT,
            placesTaken: integer(0),
            status: 'PUBLISHED',
            registrationState: STATE,
            divisionCount: integer(1),
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
          `${mockServer.url}${API_ROUTES.bjjEireCompetitions}?page=1&pageSize=100`
        )
        expect(response.ok).toBe(true)
        const body = (await response.json()) as { data: unknown[] }
        expect(body.data.length).toBeGreaterThan(0)
      })
  })

  it('GET /api/v1/bjjeire-competition/{slug} returns the competition with its divisions', async () => {
    const pact = createPact()

    await pact
      .addInteraction()
      .given('a published competition exists')
      .uponReceiving('a request for one public competition by slug')
      .withRequest('GET', `${API_ROUTES.bjjEireCompetitions}/pact-competition`)
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody({
          id: string(),
          slug: string('pact-competition'),
          name: string(),
          date: DAY,
          entryFeeCents: integer(2500),
          currency: string('EUR'),
          registrationOpensAt: INSTANT,
          registrationClosesAt: INSTANT,
          placesTaken: integer(0),
          status: STATUS,
          registrationState: STATE,
          divisions: eachLike({
            id: string(),
            discipline: regex('GI|NO_GI', 'GI'),
            gender: regex('MALE|FEMALE', 'MALE'),
            ageCategory: regex('ADULT|MASTER_[1-5]', 'ADULT'),
            belt: regex('WHITE|BLUE|PURPLE|BROWN|BLACK', 'WHITE'),
            weightClass: string('-76 kg'),
          }),
        })
      })
      .executeTest(async mockServer => {
        const response = await fetch(
          `${mockServer.url}${API_ROUTES.bjjEireCompetitions}/pact-competition`
        )
        expect(response.ok).toBe(true)
        const body = (await response.json()) as { divisions: unknown[] }
        expect(body.divisions.length).toBeGreaterThan(0)
      })
  })
})
