import { memo, useMemo, type JSX, type ReactNode } from 'react'
import { createFeatureFlagClient } from '../client'
import type { FeatureFlagsMap } from '../definitions'
import { FeatureFlagContext } from './feature-flag-context'

interface FeatureFlagProviderProps {
  children: ReactNode
  /**
   * Resolved flag map. The boot loader (see `resolve.ts`) computes this once
   * before render in `main.tsx`. The provider builds a client from that
   * snapshot and does not fetch.
   *
   * Tests pass an explicit map via `renderWithProviders({ featureFlags })`.
   */
  flags: FeatureFlagsMap
}

export const FeatureFlagProvider = memo(function FeatureFlagProvider({
  children,
  flags,
}: FeatureFlagProviderProps): JSX.Element {
  const client = useMemo(() => createFeatureFlagClient(flags), [flags])
  return (
    <FeatureFlagContext.Provider value={client}>
      {children}
    </FeatureFlagContext.Provider>
  )
})
