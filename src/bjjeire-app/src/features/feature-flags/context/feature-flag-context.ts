import { createContext } from 'react'
import type { FeatureFlagsMap } from '../types'
import { DEFAULT_FLAGS } from '../types'

export const FeatureFlagContext = createContext<FeatureFlagsMap>(DEFAULT_FLAGS)
