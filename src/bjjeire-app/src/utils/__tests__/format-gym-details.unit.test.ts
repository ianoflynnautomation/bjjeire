import { describe, it, expect } from 'vitest'
import { buildTrialOfferText } from '../format-gym-details'

describe('buildTrialOfferText', () => {
  it('given one free class, when the trial text is built, then the singular form is used', () => {
    const { primaryPart, ariaLabel } = buildTrialOfferText({
      isAvailable: true,
      freeClasses: 1,
    })
    expect(primaryPart).toBe('1 free class')
    expect(ariaLabel).toBe('Trial Offer: 1 free class')
  })

  it('given multiple free classes, when the trial text is built, then the plural form is used', () => {
    const { primaryPart } = buildTrialOfferText({
      isAvailable: true,
      freeClasses: 3,
    })
    expect(primaryPart).toBe('3 free classes')
  })

  it('given one free day, when the trial text is built, then the singular form is used', () => {
    const { primaryPart, ariaLabel } = buildTrialOfferText({
      isAvailable: true,
      freeDays: 1,
    })
    expect(primaryPart).toBe('1 free day')
    expect(ariaLabel).toBe('Trial Offer: 1 free day')
  })

  it('given multiple free days, when the trial text is built, then the plural form is used', () => {
    const { primaryPart } = buildTrialOfferText({
      isAvailable: true,
      freeDays: 7,
    })
    expect(primaryPart).toBe('7 free days')
  })

  it('given both free classes and free days, when the trial text is built, then free classes win', () => {
    const { primaryPart } = buildTrialOfferText({
      isAvailable: true,
      freeClasses: 2,
      freeDays: 7,
    })
    expect(primaryPart).toBe('2 free classes')
  })

  it('given notes, when the trial text is built, then the notes are appended to the aria-label', () => {
    const { ariaLabel } = buildTrialOfferText({
      isAvailable: true,
      freeClasses: 1,
      notes: 'No gi only',
    })
    expect(ariaLabel).toBe('Trial Offer: 1 free class. No gi only')
  })

  it('given only notes, when the trial text is built, then the notes form the aria-label', () => {
    const { primaryPart, ariaLabel } = buildTrialOfferText({
      isAvailable: true,
      notes: 'Contact gym for details',
    })
    expect(primaryPart).toBeNull()
    expect(ariaLabel).toBe('Trial Offer: Contact gym for details')
  })

  it('given no details, when the trial text is built, then the fallback text is used', () => {
    const { primaryPart, ariaLabel } = buildTrialOfferText({
      isAvailable: true,
    })
    expect(primaryPart).toBeNull()
    expect(ariaLabel).toContain('Trial Offer:')
    expect(ariaLabel.length).toBeGreaterThan('Trial Offer: '.length)
  })
})
