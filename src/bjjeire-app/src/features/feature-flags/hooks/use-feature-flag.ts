import { useContext } from 'react'
import type { FeatureFlagClient } from '../client'
import { FeatureFlagContext } from '../context/feature-flag-context'
import type { FeatureFlagName } from '../types'

export function useFeatureFlagClient(): FeatureFlagClient {
  return useContext(FeatureFlagContext)
}

export function useFeatureFlag(name: FeatureFlagName): boolean {
  return useFeatureFlagClient().isEnabled(name)
}
