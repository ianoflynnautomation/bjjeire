import { useContext } from 'react'
import { FeatureFlagContext } from '../context/feature-flag-context'
import type { FeatureFlagName } from '../types'

export function useFeatureFlag(name: FeatureFlagName): boolean {
  return useContext(FeatureFlagContext)[name]
}
