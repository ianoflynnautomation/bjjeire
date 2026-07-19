import { memo } from 'react'
import type { JSX, ReactNode } from 'react'
import { useFeatureFlag } from '../hooks/use-feature-flag'
import type { FeatureFlagName } from '../types'

interface FeatureFlagProps {
  name: FeatureFlagName
  children: ReactNode
  fallback?: ReactNode
}

export const FeatureFlag = memo(function FeatureFlag({
  name,
  children,
  fallback = null,
}: FeatureFlagProps): JSX.Element {
  const enabled = useFeatureFlag(name)
  return <>{enabled ? children : fallback}</>
})
