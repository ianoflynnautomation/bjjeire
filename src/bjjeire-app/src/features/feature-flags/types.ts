export type FeatureFlagName = 'BjjEvents' | 'Gyms'

export type FeatureFlagsMap = Record<FeatureFlagName, boolean>

export const DEFAULT_FLAGS: FeatureFlagsMap = {
  BjjEvents: false,
  Gyms: false,
}
