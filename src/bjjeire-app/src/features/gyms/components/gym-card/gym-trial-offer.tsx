import type { ReactNode, JSX } from 'react'
import { SparklesIcon } from '@heroicons/react/20/solid'
import type { TrialOfferDto } from '@/types/gyms'
import { DetailItem } from '@/components/ui/icons/detail-item'
import { GymCardTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'
import { buildTrialOfferText } from '@/utils/format-gym-details'

const gymCard = uiContent.gyms.card

interface GymTrialOfferProps {
  trialOffer?: TrialOfferDto
  'data-testid'?: string
}

export const GymTrialOffer = function GymTrialOffer({
  trialOffer,
  'data-testid': rootDataTestId,
}: GymTrialOfferProps): JSX.Element | null {
  if (!trialOffer?.isAvailable) {
    return null
  }

  const { primaryPart, ariaLabel } = buildTrialOfferText(trialOffer)

  let displayContent: ReactNode
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
      className="mt-1 rounded-xl bg-warning-50 px-2 py-1 text-warning-800 ring-1 ring-warning-500/20 dark:bg-warning-950/40 dark:text-warning-500"
      iconClassName="h-5 w-5 text-warning-500 dark:text-warning-500"
    >
      <span className="font-medium">{displayContent}</span>
    </DetailItem>
  )
}
