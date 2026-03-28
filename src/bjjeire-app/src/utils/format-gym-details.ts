import type { TrialOfferDto } from '@/types/gyms'
import { uiContent } from '@/config/ui-content'

const { card: gymCard } = uiContent.gyms

interface TrialOfferText {
  primaryPart: string | null
  ariaLabel: string
}

export function buildTrialOfferText(trialOffer: TrialOfferDto): TrialOfferText {
  let primaryPart: string | null = null

  if (trialOffer.freeClasses && trialOffer.freeClasses > 0) {
    const plural = trialOffer.freeClasses > 1 ? 'es' : ''
    primaryPart = `${trialOffer.freeClasses} free class${plural}`
  } else if (trialOffer.freeDays && trialOffer.freeDays > 0) {
    const plural = trialOffer.freeDays > 1 ? 's' : ''
    primaryPart = `${trialOffer.freeDays} free day${plural}`
  }

  const ariaTextParts: string[] = []
  if (primaryPart) {
    ariaTextParts.push(primaryPart)
  }
  if (trialOffer.notes) {
    ariaTextParts.push(trialOffer.notes)
  }
  if (ariaTextParts.length === 0) {
    ariaTextParts.push(gymCard.trialOfferFallback)
  }

  return {
    primaryPart,
    ariaLabel: `Trial Offer: ${ariaTextParts.join('. ')}`,
  }
}
