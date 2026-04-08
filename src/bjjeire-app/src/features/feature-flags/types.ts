export type FeatureFlagName = 'BjjEvents' | 'Gyms' | 'Competitions' | 'Stores'

export type FeatureFlagsMap = Record<FeatureFlagName, boolean>

export const DEFAULT_FLAGS: FeatureFlagsMap = {
  BjjEvents: false,
  Gyms: false,
  Competitions: false,
  Stores: false,
}
