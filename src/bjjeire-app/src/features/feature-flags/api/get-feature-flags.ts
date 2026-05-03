import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { FeatureFlagsMap } from '../types'

export function getFeatureFlags(): Promise<FeatureFlagsMap> {
  return api.get<FeatureFlagsMap>(API_RESOURCE_ROUTES.featureFlags)
}
