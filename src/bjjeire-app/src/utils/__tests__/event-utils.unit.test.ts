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
    [BjjEventType.Camp, 'Camp'],
    [BjjEventType.Other, 'Other'],
  ] as const)(
    'given event type %s, when the label is resolved, then "%s" is returned',
    (type, expected) => {
      expect(getEventTypeLabel(type)).toBe(expected)
    }
  )

  it('given a label string in any case, when the label is resolved, then the canonical label is returned', () => {
    expect(getEventTypeLabel('open mat')).toBe('Open Mat')
    expect(getEventTypeLabel('SEMINAR')).toBe('Seminar')
  })

  it('given an API wire value, when the label is resolved, then the display label is returned', () => {
    expect(getEventTypeLabel('OpenMat')).toBe('Open Mat')
    expect(getEventTypeLabel('Seminar')).toBe('Seminar')
    expect(getEventTypeLabel('Camp')).toBe('Camp')
    expect(getEventTypeLabel('Other')).toBe('Other')
  })

  it('given an unrecognised value, when the label is resolved, then "Event" is returned', () => {
    expect(getEventTypeLabel('unknown-type')).toBe('Event')
  })
})

describe('getEventTypeBannerGradient', () => {
  it('given an OpenMat event, when the banner gradient is resolved, then the emerald gradient is returned', () => {
    expect(getEventTypeBannerGradient(BjjEventType.OpenMat)).toContain(
      'emerald'
    )
  })

  it('given a Camp event, when the banner gradient is resolved, then the violet gradient is returned', () => {
    expect(getEventTypeBannerGradient(BjjEventType.Camp)).toContain('violet')
  })

  it('given a Seminar event, when the banner gradient is resolved, then the amber gradient is returned', () => {
    expect(getEventTypeBannerGradient(BjjEventType.Seminar)).toContain('amber')
  })

  it('given an Other event, when the banner gradient is resolved, then the slate gradient is returned', () => {
    expect(getEventTypeBannerGradient(BjjEventType.Other)).toContain('slate')
  })

  it('given an unknown type, when the banner gradient is resolved, then the default slate gradient is returned', () => {
    expect(getEventTypeBannerGradient('unknown')).toContain('slate')
  })
})

describe('getEventTypeColorClasses', () => {
  it('given an OpenMat event, when the color classes are resolved, then the emerald classes are returned', () => {
    expect(getEventTypeColorClasses(BjjEventType.OpenMat)).toContain('emerald')
  })

  it('given a Camp event, when the color classes are resolved, then the violet classes are returned', () => {
    expect(getEventTypeColorClasses(BjjEventType.Camp)).toContain('violet')
  })

  it('given a Seminar event, when the color classes are resolved, then the amber classes are returned', () => {
    expect(getEventTypeColorClasses(BjjEventType.Seminar)).toContain('amber')
  })

  it('given an Other or unknown event, when the color classes are resolved, then the slate classes are returned', () => {
    expect(getEventTypeColorClasses(BjjEventType.Other)).toContain('slate')
    expect(getEventTypeColorClasses('unknown')).toContain('slate')
  })
})
