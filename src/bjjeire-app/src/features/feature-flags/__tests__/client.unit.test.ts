import { describe, expect, it } from 'vitest'
import { features } from '@/config/features'
import { createFeatureFlagClient } from '../client'
import {
  DEFAULT_FLAGS,
  FEATURE_FLAGS,
  FEATURE_FLAG_NAMES,
} from '../definitions'

describe('createFeatureFlagClient', () => {
  it('given a resolved snapshot, when a flag is read, then only a strict true is enabled', () => {
    const client = createFeatureFlagClient({
      ...DEFAULT_FLAGS,
      Gyms: true,
    })

    expect(client.isEnabled('Gyms')).toBe(true)
    expect(client.isEnabled('Stores')).toBe(false)
  })

  it('given a snapshot missing a key at runtime, when that flag is read, then it fails closed', () => {
    const client = createFeatureFlagClient({})

    expect(client.isEnabled('BjjEvents')).toBe(false)
  })
})

describe('feature flag catalogue', () => {
  it('given the route table, when it is compared with the catalogue, then both list the same flags', () => {
    expect(features.map(feature => feature.flag).sort()).toEqual(
      [...FEATURE_FLAG_NAMES].sort()
    )
  })

  it('given the catalogue, when each flag is inspected, then it fail-closes and records its own wire name', () => {
    for (const name of FEATURE_FLAG_NAMES) {
      expect(FEATURE_FLAGS[name].key).toBe(name)
      expect(FEATURE_FLAGS[name].defaultValue).toBe(false)
      expect(FEATURE_FLAGS[name].description.length).toBeGreaterThan(0)
      expect(FEATURE_FLAGS[name].addedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
