import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'

export function getFeatureFlags(): Promise<unknown> {
  return api.get<unknown>(API_RESOURCE_ROUTES.featureFlags)
}
