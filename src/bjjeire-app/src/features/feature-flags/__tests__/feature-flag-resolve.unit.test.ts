import { describe, it, expect } from 'vitest'
import { DEFAULT_FLAGS } from '../definitions'
import { resolveFlags } from '../resolve'

describe('resolveFlags', () => {
  it('given no layers, when flags are resolved, then the fail-closed defaults are returned', () => {
    expect(resolveFlags([])).toEqual(DEFAULT_FLAGS)
  })

  it('given overlapping layers, when flags are resolved, then later layers win', () => {
    const result = resolveFlags([
      { Gyms: true, Stores: true },
      { Stores: false },
    ])
    expect(result.Gyms).toBe(true)
    expect(result.Stores).toBe(false)
  })

  it('given layers missing some flags, when flags are resolved, then absent flags keep their defaults', () => {
    const result = resolveFlags([{ Gyms: true }])
    expect(result.BjjEvents).toBe(DEFAULT_FLAGS.BjjEvents)
    expect(result.Competitions).toBe(DEFAULT_FLAGS.Competitions)
  })
})
