import type { FeatureFlagName } from './definitions'

/**
 * Read API shared by hooks and gates. The boot loader resolves one snapshot;
 * this client answers from it. A future provider can replace
 * {@link createFeatureFlagClient} without changing call sites.
 */
export interface FeatureFlagClient {
  isEnabled(flag: FeatureFlagName): boolean
}

export function createFeatureFlagClient(
  flags: Readonly<Partial<Record<FeatureFlagName, boolean>>>
): FeatureFlagClient {
  return {
    isEnabled(flag: FeatureFlagName): boolean {
      // Partial on purpose: a missing runtime key must stay off, not undefined.
      return flags[flag] === true
    },
  }
}
