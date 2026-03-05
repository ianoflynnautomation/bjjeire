import React, { memo } from 'react'
import { SparklesIcon } from '@heroicons/react/20/solid'
import type { TrialOfferDto } from '@/types/gyms'
import { DetailItem } from '@/components/ui/icons/detail-item'
import { GymCardTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'

const gymCard = uiContent.gyms.card

interface GymTrialOfferProps {
  trialOffer?: TrialOfferDto
  'data-testid'?: string
}

export const GymTrialOffer: React.FC<GymTrialOfferProps> = memo(
  ({ trialOffer, 'data-testid': rootDataTestId }) => {
    if (!trialOffer || !trialOffer.isAvailable) {
      return null
    }

    let offerPrimaryPart: string | null = null
    if (trialOffer.freeClasses && trialOffer.freeClasses > 0) {
      offerPrimaryPart = `${trialOffer.freeClasses} free class${trialOffer.freeClasses > 1 ? 'es' : ''}`
    } else if (trialOffer.freeDays && trialOffer.freeDays > 0) {
      offerPrimaryPart = `${trialOffer.freeDays} free day${trialOffer.freeDays > 1 ? 's' : ''}`
    }

    let displayContent: React.ReactNode
    const ariaTextParts: string[] = []

    if (offerPrimaryPart) {
      ariaTextParts.push(offerPrimaryPart)
    }
    if (trialOffer.notes) {
      ariaTextParts.push(trialOffer.notes)
    }

    if (offerPrimaryPart && trialOffer.notes) {
      displayContent = (
        <>
          {offerPrimaryPart}. {trialOffer.notes}
        </>
      )
    } else if (offerPrimaryPart) {
      displayContent = <>{offerPrimaryPart}</>
    } else if (trialOffer.notes) {
      displayContent = <>{trialOffer.notes}</>
    } else {
      const fallbackText = gymCard.trialOfferFallback
      displayContent = fallbackText
      ariaTextParts.push(fallbackText)
    }

    const finalAriaLabel = `Trial Offer: ${ariaTextParts.join('. ')}`

    const actualRootDataTestId = rootDataTestId || GymCardTestIds.TRIAL_OFFER

    return (
      <DetailItem
        icon={<SparklesIcon />}
        ariaLabel={finalAriaLabel}
        data-testid={actualRootDataTestId}
        className="mt-1 rounded-xl bg-amber-900/30 px-2 py-1 text-amber-200 ring-1 ring-amber-500/20"
        iconClassName="h-5 w-5 text-amber-400"
      >
        <span className="font-medium">{displayContent}</span>
      </DetailItem>
    )
  }
)
