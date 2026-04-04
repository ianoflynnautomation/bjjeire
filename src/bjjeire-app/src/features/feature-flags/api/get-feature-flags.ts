import { api } from '@/lib/api-client'
import type { FeatureFlagsMap } from '../types'

export function getFeatureFlags(): Promise<FeatureFlagsMap> {
  return api.get<FeatureFlagsMap>('/api/featureflag')
}
