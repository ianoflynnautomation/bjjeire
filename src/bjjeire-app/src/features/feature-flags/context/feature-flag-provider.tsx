import { type ReactNode, type JSX } from 'react'
import { FeatureFlagContext } from './feature-flag-context'
import type { FeatureFlagsMap } from '../definitions'

interface FeatureFlagProviderProps {
  children: ReactNode
  /**
   * Resolved flag map. The boot loader (see `resolve.ts`) computes this
   * once before render in `main.tsx`; the provider is a pure pass-through
   * to context — no fetching, no race, no useEffect.
   *
   * Tests pass an explicit map via `renderWithProviders({ featureFlags })`.
   */
  flags: FeatureFlagsMap
}

export function FeatureFlagProvider({
  children,
  flags,
}: FeatureFlagProviderProps): JSX.Element {
  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  )
}
