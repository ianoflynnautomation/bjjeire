import { describe, it, expect } from 'vitest'
import { getCountyDisplayLabel } from '@/utils/county-utils'
import { County } from '@/constants/counties'

describe('getCountyDisplayLabel', () => {
  it('given an undefined county, when the label is resolved, then undefined is returned', () => {
    expect(getCountyDisplayLabel(undefined)).toBeUndefined()
  })

  it('given the county "all", when the label is resolved, then undefined is returned', () => {
    expect(getCountyDisplayLabel('all')).toBeUndefined()
  })

  it('given the county "All" (case-insensitive), when the label is resolved, then undefined is returned', () => {
    expect(getCountyDisplayLabel('All')).toBeUndefined()
  })

  it('given a known county, when the label is resolved, then its display label is returned', () => {
    expect(getCountyDisplayLabel(County.Dublin)).toBe('Dublin')
  })

  it('given an unknown county, when the label is resolved, then the raw value is returned', () => {
    expect(getCountyDisplayLabel('Atlantis')).toBe('Atlantis')
  })
})
