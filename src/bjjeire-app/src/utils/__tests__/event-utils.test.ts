import { describe, it, expect } from 'vitest'
import {
  getEventTypeLabel,
  getEventTypeBannerGradient,
  getEventTypeColorClasses,
} from '../event-utils'
import { BjjEventType } from '@/types/event'

describe('getEventTypeLabel', () => {
  it.each([
    [BjjEventType.OpenMat, 'Open Mat'],
    [BjjEventType.Seminar, 'Seminar'],
    [BjjEventType.Tournament, 'Tournament'],
    [BjjEventType.Camp, 'Camp'],
    [BjjEventType.Other, 'Other'],
  ] as const)('returns "%s" for type %s', (type, expected) => {
    expect(getEventTypeLabel(type)).toBe(expected)
  })

  it('resolves by label string (case-insensitive)', () => {
    expect(getEventTypeLabel('open mat')).toBe('Open Mat')
    expect(getEventTypeLabel('SEMINAR')).toBe('Seminar')
  })

  it('returns "Event" for an unrecognised value', () => {
    expect(getEventTypeLabel('unknown-type')).toBe('Event')
  })
})

describe('getEventTypeBannerGradient', () => {
  it('returns emerald gradient for OpenMat', () => {
    expect(getEventTypeBannerGradient(BjjEventType.OpenMat)).toContain(
      'emerald'
    )
  })

  it('returns violet gradient for Camp', () => {
    expect(getEventTypeBannerGradient(BjjEventType.Camp)).toContain('violet')
  })

  it('returns rose gradient for Tournament', () => {
    expect(getEventTypeBannerGradient(BjjEventType.Tournament)).toContain(
      'rose'
    )
  })

  it('returns amber gradient for Seminar', () => {
    expect(getEventTypeBannerGradient(BjjEventType.Seminar)).toContain('amber')
  })

  it('returns slate gradient for Other', () => {
    expect(getEventTypeBannerGradient(BjjEventType.Other)).toContain('slate')
  })

  it('returns default slate gradient for unknown type', () => {
    expect(getEventTypeBannerGradient('unknown')).toContain('slate')
  })
})

describe('getEventTypeColorClasses', () => {
  it('returns emerald classes for OpenMat', () => {
    expect(getEventTypeColorClasses(BjjEventType.OpenMat)).toContain('emerald')
  })

  it('returns violet classes for Camp', () => {
    expect(getEventTypeColorClasses(BjjEventType.Camp)).toContain('violet')
  })

  it('returns rose classes for Tournament', () => {
    expect(getEventTypeColorClasses(BjjEventType.Tournament)).toContain('rose')
  })

  it('returns amber classes for Seminar', () => {
    expect(getEventTypeColorClasses(BjjEventType.Seminar)).toContain('amber')
  })

  it('returns slate classes for Other and unknowns', () => {
    expect(getEventTypeColorClasses(BjjEventType.Other)).toContain('slate')
    expect(getEventTypeColorClasses('unknown')).toContain('slate')
  })
})
