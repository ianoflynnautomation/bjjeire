import { describe, it, expect } from 'vitest'
import { buildTrialOfferText } from '../formatGymDetails'

describe('buildTrialOfferText', () => {
  it('formats singular free class', () => {
    const { primaryPart, ariaLabel } = buildTrialOfferText({
      isAvailable: true,
      freeClasses: 1,
    })
    expect(primaryPart).toBe('1 free class')
    expect(ariaLabel).toBe('Trial Offer: 1 free class')
  })

  it('formats plural free classes', () => {
    const { primaryPart } = buildTrialOfferText({
      isAvailable: true,
      freeClasses: 3,
    })
    expect(primaryPart).toBe('3 free classes')
  })

  it('formats singular free day', () => {
    const { primaryPart, ariaLabel } = buildTrialOfferText({
      isAvailable: true,
      freeDays: 1,
    })
    expect(primaryPart).toBe('1 free day')
    expect(ariaLabel).toBe('Trial Offer: 1 free day')
  })

  it('formats plural free days', () => {
    const { primaryPart } = buildTrialOfferText({
      isAvailable: true,
      freeDays: 7,
    })
    expect(primaryPart).toBe('7 free days')
  })

  it('prefers freeClasses over freeDays when both are set', () => {
    const { primaryPart } = buildTrialOfferText({
      isAvailable: true,
      freeClasses: 2,
      freeDays: 7,
    })
    expect(primaryPart).toBe('2 free classes')
  })

  it('appends notes to ariaLabel when present', () => {
    const { ariaLabel } = buildTrialOfferText({
      isAvailable: true,
      freeClasses: 1,
      notes: 'No gi only',
    })
    expect(ariaLabel).toBe('Trial Offer: 1 free class. No gi only')
  })

  it('uses notes in ariaLabel when no classes or days are set', () => {
    const { primaryPart, ariaLabel } = buildTrialOfferText({
      isAvailable: true,
      notes: 'Contact gym for details',
    })
    expect(primaryPart).toBeNull()
    expect(ariaLabel).toBe('Trial Offer: Contact gym for details')
  })

  it('uses fallback text in ariaLabel when nothing is set', () => {
    const { primaryPart, ariaLabel } = buildTrialOfferText({
      isAvailable: true,
    })
    expect(primaryPart).toBeNull()
    expect(ariaLabel).toContain('Trial Offer:')
    expect(ariaLabel.length).toBeGreaterThan('Trial Offer: '.length)
  })
})
