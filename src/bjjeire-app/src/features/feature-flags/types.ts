import { features, type FeatureFlagName } from '@/config/features'

export type { FeatureFlagName }

export type FeatureFlagsMap = Record<FeatureFlagName, boolean>

export const DEFAULT_FLAGS: FeatureFlagsMap = Object.fromEntries(
  features.map(f => [f.flag, false])
) as FeatureFlagsMap
