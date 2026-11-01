import { memo, type JSX, type ReactNode } from 'react'
import type { FeatureFlagName } from '../types'
import { FeatureGate } from './feature-gate'

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
  return (
    <FeatureGate flag={name} fallback={fallback}>
      {children}
    </FeatureGate>
  )
})
