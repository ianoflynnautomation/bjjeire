import React, { memo } from 'react'
import { SparklesIcon } from '@heroicons/react/20/solid'
import { TrialOfferDto } from '../../../../types/gyms'
import { DetailItem } from '../../../../components/ui/icons/detail-item'
import { GymTrialOfferTestIds } from '../../../../constants/gymDataTestIds'

interface GymTrialOfferProps {
  trialOffer?: TrialOfferDto
  'data-testid'?: string
}

export const GymTrialOffer: React.FC<GymTrialOfferProps> = memo(
  ({
    trialOffer,
    'data-testid': rootDataTestId
  }) => {
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
      const fallbackText = 'Trial offer available (details not specified)'
      displayContent = fallbackText
      ariaTextParts.push(fallbackText)
    }

    const finalAriaLabel = `Trial Offer: ${ariaTextParts.join('. ')}`

    const actualRootDataTestId =
      rootDataTestId || GymTrialOfferTestIds.ROOT

    return (
      <DetailItem
        icon={<SparklesIcon />}
        ariaLabel={finalAriaLabel}
        data-testid={actualRootDataTestId}
        className="mt-1 text-emerald-700 dark:text-emerald-400"
        iconClassName="h-5 w-5 text-amber-500 dark:text-amber-400"
      >
        <span className="font-medium">{displayContent}</span>
      </DetailItem>
    )
  }
)
