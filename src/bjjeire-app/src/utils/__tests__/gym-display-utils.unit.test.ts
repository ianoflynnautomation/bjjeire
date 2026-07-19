import { describe, it, expect } from 'vitest'
import {
  getGymStatusLabel,
  getGymStatusColorScheme,
  getClassCategoryLabel,
} from '../gym-display-utils'
import { GymStatus, ClassCategory } from '@/types/gyms'

describe('getGymStatusLabel', () => {
  it.each([
    [GymStatus.Active, 'Active'],
    [GymStatus.PendingApproval, 'Pending Approval'],
    [GymStatus.TemporarilyClosed, 'Temporarily Closed'],
    [GymStatus.PermanentlyClosed, 'Permanently Closed'],
    [GymStatus.OpeningSoon, 'Opening Soon'],
    [GymStatus.Draft, 'Draft'],
    [GymStatus.Rejected, 'Rejected'],
  ] as const)(
    'given status %s, when it is resolved, then "%s" is returned',
    (status, expected) => {
      expect(getGymStatusLabel(status)).toBe(expected)
    }
  )
})

describe('getGymStatusColorScheme', () => {
  it.each([
    [GymStatus.Active, 'emerald'],
    [GymStatus.OpeningSoon, 'emerald'],
    [GymStatus.PendingApproval, 'amber'],
    [GymStatus.Draft, 'amber'],
    [GymStatus.TemporarilyClosed, 'blue'],
    [GymStatus.PermanentlyClosed, 'red'],
    [GymStatus.Rejected, 'red'],
  ] as const)(
    'given status %s, when it is resolved, then "%s" is returned',
    (status, expected) => {
      expect(getGymStatusColorScheme(status)).toBe(expected)
    }
  )
})

describe('getClassCategoryLabel', () => {
  it('given the BJJGiAllLevels category, when the label is resolved, then the human-readable label is returned', () => {
    expect(getClassCategoryLabel(ClassCategory.BJJGiAllLevels)).toBe(
      'BJJ Gi (All Levels)'
    )
  })

  it('given the WomensOnly category, when the label is resolved, then the human-readable label is returned', () => {
    expect(getClassCategoryLabel(ClassCategory.WomensOnly)).toBe("Women's Only")
  })

  it('given the KidsBJJ category, when the label is resolved, then the human-readable label is returned', () => {
    expect(getClassCategoryLabel(ClassCategory.KidsBJJ)).toBe('Kids BJJ')
  })

  it('given the CompetitionTraining category, when the label is resolved, then the human-readable label is returned', () => {
    expect(getClassCategoryLabel(ClassCategory.CompetitionTraining)).toBe(
      'Competition Training'
    )
  })
})
