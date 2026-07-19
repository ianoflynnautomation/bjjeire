import { logger } from '@/lib/logger'
import { getFeatureFlags } from './api/get-feature-flags'
import {
  DEFAULT_FLAGS,
  FEATURE_FLAG_NAMES,
  type FeatureFlagName,
  type FeatureFlagsMap,
} from './definitions'

export const TEST_OVERRIDES_GLOBAL = '__BJJEIRE_TEST_FLAG_OVERRIDES__'

type Layer = Partial<FeatureFlagsMap>

function isFeatureFlagName(name: string): name is FeatureFlagName {
  return (FEATURE_FLAG_NAMES as readonly string[]).includes(name)
}

function sanitize(input: unknown): Layer {
  if (typeof input !== 'object' || input === null) {
    return {}
  }
  const out: Partial<Record<FeatureFlagName, boolean>> = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (isFeatureFlagName(key) && typeof value === 'boolean') {
      out[key] = value
    }
  }
  return out
}

export function resolveFlags(layers: readonly Layer[]): FeatureFlagsMap {
  return layers.reduce<FeatureFlagsMap>(
    (acc, layer) => ({ ...acc, ...layer }),
    DEFAULT_FLAGS
  )
}

export function readTestOverrides(): Layer | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  const value = (window as unknown as Record<string, unknown>)[
    TEST_OVERRIDES_GLOBAL
  ]
  if (typeof value !== 'object' || value === null) {
    return undefined
  }
  return sanitize(value)
}

/**
 * Resolve flags once at app boot. Fetches from the backend, falls back to
 * defaults on any error, and applies test overrides last. Called from
 * `main.tsx` BEFORE `createRoot().render()` so the route gate in `App.tsx`
 * never sees an under-determined flag map — kills the redirect race.
 */
export async function loadFeatureFlags(): Promise<FeatureFlagsMap> {
  const layers: Layer[] = []

  try {
    const remote = await getFeatureFlags()
    layers.push(sanitize(remote))
  } catch (error) {
    logger.warn(
      'Feature flag resolution failed — falling back to defaults',
      error
    )
  }

  const testOverrides = readTestOverrides()
  if (testOverrides !== undefined) {
    layers.push(testOverrides)
  }

  return resolveFlags(layers)
}
