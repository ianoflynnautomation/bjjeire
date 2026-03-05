import React, { memo } from 'react'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { ensureExternalUrlScheme } from '@/utils/formattingUtils'
import { GymCardTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'
import { CardActionButton } from '@/components/ui/button/button'

const gymCard = uiContent.gyms.card

interface GymFooterProps {
  websiteUrl?: string
  gymName: string
}

export const GymFooter: React.FC<GymFooterProps> = memo(
  ({
    websiteUrl,
    gymName,
  }) => {
    const externalWebsiteUrl =
      websiteUrl && websiteUrl.trim() !== ''
        ? ensureExternalUrlScheme(websiteUrl)
        : undefined

    const fallback = gymName || gymCard.fallbackRef
    const buttonText = externalWebsiteUrl
      ? gymCard.visitWebsiteButton
      : gymCard.noWebsiteButton
    const ariaLabel = externalWebsiteUrl
      ? `Visit website for ${fallback}`
      : `No website available for ${fallback}`
    const title = externalWebsiteUrl
      ? `Visit website for ${fallback}`
      : `No website available for ${fallback}`

    return (
      <div className="mt-auto border-t border-white/[0.08] pt-3">
        <CardActionButton
          href={externalWebsiteUrl}
          icon={<ArrowTopRightOnSquareIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />}
          aria-label={ariaLabel}
          title={title}
          data-testid={GymCardTestIds.WEBSITE_LINK}
          className="rounded-xl"
        >
          {buttonText}
        </CardActionButton>
      </div>
    )
  }
)
