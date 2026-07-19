import { http, HttpResponse } from 'msw'
import { API_ROUTES } from '@/config/api-routes'
import type { FeatureFlagsMap } from '@/features/feature-flags'

export const defaultFeatureFlags: FeatureFlagsMap = {
  BjjEvents: true,
  Gyms: true,
  Competitions: true,
  Stores: true,
}

export const featureFlagsHandlers = [
  http.get(`*${API_ROUTES.featureFlags}`, () =>
    HttpResponse.json(defaultFeatureFlags)
  ),
]
