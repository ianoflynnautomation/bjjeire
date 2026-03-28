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
  ] as const)('returns "%s" for %s', (status, expected) => {
    expect(getGymStatusLabel(status)).toBe(expected)
  })
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
  ] as const)('returns "%s" for %s', (status, expected) => {
    expect(getGymStatusColorScheme(status)).toBe(expected)
  })
})

describe('getClassCategoryLabel', () => {
  it('returns human-readable label for BJJGiAllLevels', () => {
    expect(getClassCategoryLabel(ClassCategory.BJJGiAllLevels)).toBe(
      'BJJ Gi (All Levels)'
    )
  })

  it('returns human-readable label for WomensOnly', () => {
    expect(getClassCategoryLabel(ClassCategory.WomensOnly)).toBe("Women's Only")
  })

  it('returns human-readable label for KidsBJJ', () => {
    expect(getClassCategoryLabel(ClassCategory.KidsBJJ)).toBe('Kids BJJ')
  })

  it('returns human-readable label for CompetitionTraining', () => {
    expect(getClassCategoryLabel(ClassCategory.CompetitionTraining)).toBe(
      'Competition Training'
    )
  })
})
