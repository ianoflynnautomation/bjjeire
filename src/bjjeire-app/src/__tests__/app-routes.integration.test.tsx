import { Suspense } from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { AppRoutes } from '@/App'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import {
  loadFeatureFlags,
  type FeatureFlagsMap,
} from '@/features/feature-flags'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'

function renderAppRoutes(
  initialRoute: string,
  featureFlags?: FeatureFlagsMap
): void {
  renderWithProviders(
    <Suspense fallback={null}>
      <AppRoutes />
    </Suspense>,
    { initialRoutes: [initialRoute], featureFlags }
  )
}

describe('AppRoutes', () => {
  it('given the Gyms flag is off, when a visitor opens /gyms, then they are redirected to About', async () => {
    renderAppRoutes(paths.gyms.path)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: uiContent.about.title,
      })
    ).toBeInTheDocument()
  })

  it('AC-GYM-014: given the flag fetch fails, when a visitor opens a map link, then every flag is off and Gyms fails closed to About', async () => {
    server.use(
      http.get(`*${API_ROUTES.featureFlags}`, () =>
        HttpResponse.json(null, { status: 500 })
      )
    )
    const flags = await loadFeatureFlags()

    renderAppRoutes(`${paths.gyms.path}?view=map`, flags)

    expect(flags.Gyms).toBe(false)
    expect(flags.GymsMap).toBe(false)
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: uiContent.about.title,
      })
    ).toBeInTheDocument()
  })
})
