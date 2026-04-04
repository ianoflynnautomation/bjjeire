import { type ReactNode, type JSX, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeatureFlagContext } from './feature-flag-context'
import { getFeatureFlags } from '../api/get-feature-flags'
import { DEFAULT_FLAGS } from '../types'
import type { FeatureFlagsMap } from '../types'

interface FeatureFlagProviderProps {
  children: ReactNode
  overrides?: Partial<FeatureFlagsMap>
}

export function FeatureFlagProvider({
  children,
  overrides,
}: FeatureFlagProviderProps): JSX.Element {
  const { data } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: getFeatureFlags,
    staleTime: 5 * 60 * 1000,
    retry: 0,
    enabled: overrides === undefined,
  })

  const flags = useMemo<FeatureFlagsMap>(
    () =>
      overrides !== undefined
        ? { ...DEFAULT_FLAGS, ...overrides }
        : { ...DEFAULT_FLAGS, ...data },
    [data, overrides]
  )

  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  )
}
