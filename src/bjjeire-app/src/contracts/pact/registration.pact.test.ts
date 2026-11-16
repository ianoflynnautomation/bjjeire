import { MatchersV3 } from '@pact-foundation/pact'
import { describe, expect, it } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { createPact } from './pact-setup'

const { eachLike, integer, string, regex } = MatchersV3

// Ids fixed by the provider states in PactProviderVerificationIT.
const TOURNAMENT_ID = '0123456789abcdef0123aaaa'
const DIVISION_ID = '0123456789abcdef0123cccc'
const REGISTRATION_ID = '0123456789abcdef0123bbbb'

const COMPETITOR_AUTHORIZATION = regex('^Bearer .+$', 'Bearer competitor-token')
const INSTANT = regex(
  String.raw`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$`,
  '2026-05-31T00:30:00Z'
)
const ID = regex('^[0-9a-f]{24}$', REGISTRATION_ID)
const STATUS = regex(
  'AWAITING_PAYMENT|CONFIRMED|CANCELLED|EXPIRED',
  'AWAITING_PAYMENT'
)

const DIVISION_BODY = {
  id: string(DIVISION_ID),
  discipline: regex('GI|NO_GI', 'GI'),
  gender: regex('MALE|FEMALE', 'FEMALE'),
  ageCategory: regex('ADULT|MASTER_[1-5]', 'ADULT'),
  belt: regex('WHITE|BLUE|PURPLE|BROWN|BLACK', 'BLUE'),
  weightClass: string('-64 kg'),
}

const CHECKOUT_BODY = {
  registrationId: ID,
  checkoutUrl: regex('^https://.+$', 'https://checkout.stripe.com/c/pay/cs_1'),
  holdExpiresAt: INSTANT,
}

describe('Pact - Tournament sign-up consumer contract', () => {
  it('GET /api/v1/tournament/{id}/eligible-division returns the divisions the competitor may enter', async () => {
    const pact = createPact()
    const path = `${API_ROUTES.tournaments}/${TOURNAMENT_ID}/eligible-division`

    await pact
      .addInteraction()
      .given('a competitor with a profile and a tournament open for sign-up')
      .uponReceiving('a request for the divisions the competitor may enter')
      .withRequest('GET', path, builder => {
        builder.headers({ Authorization: COMPETITOR_AUTHORIZATION })
      })
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody(eachLike(DIVISION_BODY))
      })
      .executeTest(async mockServer => {
        const response = await fetch(`${mockServer.url}${path}`, {
          headers: { Authorization: 'Bearer competitor-token' },
        })
        expect(response.ok).toBe(true)
      })
  })

  it('POST /api/v1/registration starts a sign-up and returns the Checkout page', async () => {
    const pact = createPact()
    const command = {
      tournamentId: TOURNAMENT_ID,
      divisionId: DIVISION_ID,
      acceptPublicListing: true,
      acceptTerms: true,
    }

    await pact
      .addInteraction()
      .given('a competitor with a profile and a tournament open for sign-up')
      .uponReceiving('a sign-up for one division')
      .withRequest('POST', API_ROUTES.registration, builder => {
        builder.headers({
          Authorization: COMPETITOR_AUTHORIZATION,
          'content-type': 'application/json',
        })
        builder.jsonBody(command)
      })
      .willRespondWith(201, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody(CHECKOUT_BODY)
      })
      .executeTest(async mockServer => {
        const response = await fetch(
          `${mockServer.url}${API_ROUTES.registration}`,
          {
            method: 'POST',
            headers: {
              Authorization: 'Bearer competitor-token',
              'content-type': 'application/json',
            },
            body: JSON.stringify(command),
          }
        )
        expect(response.status).toBe(201)
      })
  })

  it('POST /api/v1/registration/{id}/checkout returns the open Checkout page again', async () => {
    const pact = createPact()
    const path = `${API_ROUTES.registration}/${REGISTRATION_ID}/checkout`

    await pact
      .addInteraction()
      .given('a competitor with an unpaid sign-up')
      .uponReceiving('a request to return to the payment page')
      .withRequest('POST', path, builder => {
        builder.headers({ Authorization: COMPETITOR_AUTHORIZATION })
      })
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody(CHECKOUT_BODY)
      })
      .executeTest(async mockServer => {
        const response = await fetch(`${mockServer.url}${path}`, {
          method: 'POST',
          headers: { Authorization: 'Bearer competitor-token' },
        })
        expect(response.ok).toBe(true)
      })
  })

  it("GET /api/v1/registration/me lists the competitor's own sign-ups", async () => {
    const pact = createPact()
    const path = `${API_ROUTES.registration}/me`

    await pact
      .addInteraction()
      .given('a competitor with an unpaid sign-up')
      .uponReceiving("a request for the competitor's sign-ups")
      .withRequest('GET', path, builder => {
        builder.headers({ Authorization: COMPETITOR_AUTHORIZATION })
      })
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody(
          eachLike({
            id: ID,
            tournamentId: string(TOURNAMENT_ID),
            tournamentSlug: string('pact-sign-up'),
            tournamentName: string('Pact Sign-Up Tournament'),
            tournamentDate: regex(String.raw`^\d{4}-\d{2}-\d{2}$`, '2026-06-27'),
            division: DIVISION_BODY,
            status: STATUS,
            amountCents: integer(2500),
            currency: string('EUR'),
            paymentStatus: regex('PENDING|PAID|FAILED', 'PENDING'),
            holdExpiresAt: INSTANT,
            refundableUntil: INSTANT,
          })
        )
      })
      .executeTest(async mockServer => {
        const response = await fetch(`${mockServer.url}${path}`, {
          headers: { Authorization: 'Bearer competitor-token' },
        })
        expect(response.ok).toBe(true)
      })
  })

  it('GET /api/v1/tournament/{id}/competitor lists confirmed competitors by division', async () => {
    const pact = createPact()
    const path = `${API_ROUTES.tournaments}/${TOURNAMENT_ID}/competitor`

    await pact
      .addInteraction()
      .given('a tournament with a confirmed competitor')
      .uponReceiving('a request for the public competitor list')
      .withRequest('GET', path)
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody(
          eachLike({
            divisionId: string(DIVISION_ID),
            competitors: eachLike({
              displayName: string('Aoife Byrne'),
              academy: string('Team X'),
              affiliation: string('Alliance'),
            }),
          })
        )
      })
      .executeTest(async mockServer => {
        const response = await fetch(`${mockServer.url}${path}`)
        expect(response.ok).toBe(true)
      })
  })
})
