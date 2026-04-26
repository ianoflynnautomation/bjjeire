import { http, HttpResponse } from 'msw'
import type { FeatureFlagsMap } from '@/features/feature-flags'

export const defaultFeatureFlags: FeatureFlagsMap = {
  BjjEvents: true,
  Gyms: true,
  Competitions: true,
  Stores: true,
}

export const featureFlagsHandlers = [
  http.get('*/api/v1/featureflag', () =>
    HttpResponse.json(defaultFeatureFlags)
  ),
]
