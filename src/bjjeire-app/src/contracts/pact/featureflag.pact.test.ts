import { MatchersV3 } from '@pact-foundation/pact'
import { describe, expect, it } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { createPact } from './pact-setup'

const { boolean } = MatchersV3

describe('Pact - FeatureFlag consumer contract', () => {
  it('GET /api/v1/featureflag returns a map of boolean flags', async () => {
    const pact = createPact()

    await pact
      .addInteraction()
      .given('feature flags are configured')
      .uponReceiving('a request for feature flags')
      .withRequest('GET', API_ROUTES.featureFlags)
      .willRespondWith(200, builder => {
        builder.headers({ 'content-type': 'application/json' })
        builder.jsonBody({
          showDonateButton: boolean(true),
          enableDarkMode: boolean(false),
        })
      })
      .executeTest(async mockServer => {
        const response = await fetch(
          `${mockServer.url}${API_ROUTES.featureFlags}`
        )
        expect(response.ok).toBe(true)

        const body = (await response.json()) as Record<string, unknown>
        for (const [key, value] of Object.entries(body)) {
          expect(
            typeof value,
            `Feature flag '${key}' should be a boolean`
          ).toBe('boolean')
        }
      })
  })
})
