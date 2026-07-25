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
  it('given an OpenMat event, when the banner gradient is resolved, then the primary gradient is returned', () => {
    expect(getEventTypeBannerGradient(BjjEventType.OpenMat)).toContain(
      'primary'
    )
  })

  it('given a Camp event, when the banner gradient is resolved, then the ink/accent gradient is returned', () => {
    const gradient = getEventTypeBannerGradient(BjjEventType.Camp)
    expect(gradient).toContain('ink')
    expect(gradient).toContain('accent')
    expect(gradient).not.toContain('violet')
  })

  it('given a Seminar event, when the banner gradient is resolved, then the accent gradient is returned', () => {
    expect(getEventTypeBannerGradient(BjjEventType.Seminar)).toContain('accent')
  })

  it('given an Other event, when the banner gradient is resolved, then the ink gradient is returned', () => {
    expect(getEventTypeBannerGradient(BjjEventType.Other)).toContain('ink')
  })

  it('given an unknown type, when the banner gradient is resolved, then the default ink gradient is returned', () => {
    expect(getEventTypeBannerGradient('unknown')).toContain('ink')
  })
})

describe('getEventTypeColorClasses', () => {
  it('given an OpenMat event, when the color classes are resolved, then the primary classes are returned', () => {
    expect(getEventTypeColorClasses(BjjEventType.OpenMat)).toContain('primary')
  })

  it('given a Camp event, when the color classes are resolved, then ink/accent classes are returned (not violet)', () => {
    const classes = getEventTypeColorClasses(BjjEventType.Camp)
    expect(classes).toContain('accent')
    expect(classes).not.toContain('violet')
  })

  it('given a Seminar event, when the color classes are resolved, then the accent classes are returned', () => {
    expect(getEventTypeColorClasses(BjjEventType.Seminar)).toContain('accent')
  })

  it('given an Other or unknown event, when the color classes are resolved, then the ink classes are returned', () => {
    expect(getEventTypeColorClasses(BjjEventType.Other)).toContain('ink')
    expect(getEventTypeColorClasses('unknown')).toContain('ink')
  })
})
