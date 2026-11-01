import { createContext } from 'react'
import { createFeatureFlagClient } from '../client'
import type { FeatureFlagClient } from '../client'
import { DEFAULT_FLAGS } from '../definitions'

export const FeatureFlagContext = createContext<FeatureFlagClient>(
  createFeatureFlagClient(DEFAULT_FLAGS)
)
