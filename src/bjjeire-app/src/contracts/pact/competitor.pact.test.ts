import { MatchersV3 } from '@pact-foundation/pact'
import { describe, expect, it } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { createPact } from './pact-setup'

const { like, boolean, string, regex } = MatchersV3

// The provider verification's stub decoder turns this bearer value into a
// signed-in competitor (PactProviderVerificationIT, MongoIntegrationTest).
const COMPETITOR_AUTHORIZATION = regex('^Bearer .+$', 'Bearer competitor-token')
const DAY = regex(String.raw`^\d{4}-\d{2}-\d{2}$`, '1990-04-12')
const GENDER = regex('MALE|FEMALE', 'FEMALE')
const BELT = regex('WHITE|BLUE|PURPLE|BROWN|BLACK', 'BLUE')
const COUNTRY = regex('^[A-Z]{2}$', 'IE')
const ME = `${API_ROUTES.competitor}/me`

const PROFILE_BODY = {
  email: string('pact@example.test'),
  firstName: string('Aoife'),
  lastName: string('Byrne'),
  nationality: COUNTRY,
  dateOfBirth: DAY,
  gender: GENDER,
  belt: BELT,
  academy: like({ name: string('Team X') }),
  affiliation: string('Alliance'),
  profileComplete: boolean(true),
  saved: boolean(true),
}

describe('Pact - Competitor profile consumer contract', () => {
  it("GET /api/v1/competitor/me returns the signed-in competitor's own profile", async () => {
    const pact = createPact()

    await pact
      .addInteraction()
      .given('a competitor with a profile is signed in')
      .uponReceiving('a request for the signed-in competitor profile')
      .withRequest('GET', ME, builder => {
        builder.headers({ Authorization: COMPETITOR_AUTHORIZATION })
      })
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody(PROFILE_BODY)
      })
      .executeTest(async mockServer => {
        const response = await fetch(`${mockServer.url}${ME}`, {
          headers: { Authorization: 'Bearer competitor-token' },
        })
        expect(response.ok).toBe(true)
        const body = (await response.json()) as { profileComplete: boolean }
        expect(body.profileComplete).toBe(true)
      })
  })

  it('PUT /api/v1/competitor/me saves and returns the profile', async () => {
    const pact = createPact()
    const command = {
      firstName: 'Aoife',
      middleName: null,
      lastName: 'Byrne',
      nationality: 'IE',
      dateOfBirth: '1990-04-12',
      gender: 'FEMALE',
      belt: 'BLUE',
      academy: { name: 'Team X' },
      affiliation: 'Alliance',
      phone: null,
      address: null,
    }

    await pact
      .addInteraction()
      .given('a competitor is signed in')
      .uponReceiving('a save of the signed-in competitor profile')
      .withRequest('PUT', ME, builder => {
        builder.headers({
          Authorization: COMPETITOR_AUTHORIZATION,
          'content-type': 'application/json',
        })
        builder.jsonBody(command)
      })
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody(PROFILE_BODY)
      })
      .executeTest(async mockServer => {
        const response = await fetch(`${mockServer.url}${ME}`, {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer competitor-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify(command),
        })
        expect(response.ok).toBe(true)
      })
  })
})
