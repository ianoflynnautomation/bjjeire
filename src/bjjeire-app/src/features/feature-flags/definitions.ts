// Single source of truth for every feature flag the SPA knows.
//
// Add a flag: append an entry here (fail-closed default), set `addedAt`, and
// add the same wire name to `com.bjjeire.api.web.FeatureFlag`. Removing a flag
// is a delete in both places. Consumers are typed against `FeatureFlagName`,
// so a dangling reference fails the build. Retire a flag once the feature is
// either always on or deleted; do not leave a permanent toggle for a finished
// rollout.

export interface FeatureFlagDefinition {
  /** Backend flag name as returned by /api/v1/featureflag. */
  readonly key: string
  /**
   * Default while the network resolution is pending or fails. Fail-closed
   * (`false`) is the safer default — a feature appears off rather than
   * leaks half-broken UI on an API outage.
   */
  readonly defaultValue: boolean
  /** Human-readable description; surfaces in devtools and audits. */
  readonly description: string
  /** ISO date the flag was introduced. Used to detect stale flags. */
  readonly addedAt: string
}

export const FEATURE_FLAGS = {
  BjjEvents: {
    key: 'BjjEvents',
    defaultValue: false,
    description: 'Public BJJ events directory page (/events).',
    addedAt: '2025-09-01',
  },
  Gyms: {
    key: 'Gyms',
    defaultValue: false,
    description: 'Public gym directory page (/gyms).',
    addedAt: '2025-09-01',
  },
  Competitions: {
    key: 'Competitions',
    defaultValue: false,
    description: 'Public competitions page (/competitions).',
    addedAt: '2025-09-01',
  },
  Stores: {
    key: 'Stores',
    defaultValue: false,
    description: 'Public stores page (/stores).',
    addedAt: '2025-09-01',
  },
} as const satisfies Record<string, FeatureFlagDefinition>

export type FeatureFlagName = keyof typeof FEATURE_FLAGS

export type FeatureFlagsMap = Readonly<Record<FeatureFlagName, boolean>>

export const FEATURE_FLAG_NAMES = Object.keys(
  FEATURE_FLAGS
) as readonly FeatureFlagName[]

export const DEFAULT_FLAGS: FeatureFlagsMap = Object.fromEntries(
  FEATURE_FLAG_NAMES.map(name => [name, FEATURE_FLAGS[name].defaultValue])
) as FeatureFlagsMap
