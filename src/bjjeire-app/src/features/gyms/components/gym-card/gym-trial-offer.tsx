import { memo } from 'react'
import { SparklesIcon } from '@heroicons/react/20/solid'
import type { TrialOfferDto } from '@/types/gyms'
import { DetailItem } from '@/components/ui/icons/detail-item'
import { GymCardTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'
import { buildTrialOfferText } from '@/utils/formatGymDetails'

const gymCard = uiContent.gyms.card

interface GymTrialOfferProps {
  trialOffer?: TrialOfferDto
  'data-testid'?: string
}

export const GymTrialOffer = memo(function GymTrialOffer({
  trialOffer,
  'data-testid': rootDataTestId,
}: GymTrialOfferProps) {
  if (!trialOffer?.isAvailable) {
    return null
  }

  const { primaryPart, ariaLabel } = buildTrialOfferText(trialOffer)

  let displayContent: React.ReactNode
  if (primaryPart && trialOffer.notes) {
    displayContent = (
      <>
        {primaryPart}. {trialOffer.notes}
      </>
    )
  } else if (primaryPart) {
    displayContent = <>{primaryPart}</>
  } else if (trialOffer.notes) {
    displayContent = <>{trialOffer.notes}</>
  } else {
    displayContent = gymCard.trialOfferFallback
  }

  return (
    <DetailItem
      icon={<SparklesIcon />}
      ariaLabel={ariaLabel}
      data-testid={rootDataTestId ?? GymCardTestIds.TRIAL_OFFER}
      className="mt-1 rounded-xl bg-amber-900/30 px-2 py-1 text-amber-200 ring-1 ring-amber-500/20"
      iconClassName="h-5 w-5 text-amber-400"
    >
      <span className="font-medium">{displayContent}</span>
    </DetailItem>
  )
})
