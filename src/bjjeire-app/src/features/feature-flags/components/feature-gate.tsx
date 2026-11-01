import { memo, type JSX, type ReactNode } from 'react'
import { useFeatureFlag } from '../hooks/use-feature-flag'
import type { FeatureFlagName } from '../types'

interface FeatureGateProps {
  flag: FeatureFlagName
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Renders one branch from the boot-time snapshot. There is no loading state:
 * flags are resolved before the first paint, so the first commit is the final
 * tree and a disabled feature never mounts its children.
 */
export const FeatureGate = memo(function FeatureGate({
  flag,
  children,
  fallback = null,
}: FeatureGateProps): JSX.Element {
  const enabled = useFeatureFlag(flag)
  return <>{enabled ? children : fallback}</>
})
