import { memo } from 'react'
import type { JSX } from 'react'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { ensureExternalUrlScheme } from '@/utils/formatting-utils'
import { GymCardTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'
import { CardActionButton } from '@/components/ui/button/button'

const gymCard = uiContent.gyms.card

interface GymFooterProps {
  websiteUrl?: string
  gymName: string
}

export const GymFooter = memo(function GymFooter({
  websiteUrl,
  gymName,
}: GymFooterProps): JSX.Element {
  const externalWebsiteUrl =
    websiteUrl && websiteUrl.trim() !== ''
      ? ensureExternalUrlScheme(websiteUrl)
      : undefined

  const fallback = gymName || gymCard.fallbackRef
  const buttonText = externalWebsiteUrl
    ? gymCard.visitWebsiteButton
    : gymCard.noWebsiteButton
  const label = externalWebsiteUrl
    ? `Visit website for ${fallback}`
    : `No website available for ${fallback}`

  return (
    <div className="mt-auto border-t border-black/8 pt-3 dark:border-white/8">
      <CardActionButton
        href={externalWebsiteUrl}
        icon={
          <ArrowTopRightOnSquareIcon
            className="-ml-0.5 h-5 w-5"
            aria-hidden="true"
          />
        }
        aria-label={label}
        title={label}
        data-testid={GymCardTestIds.WEBSITE_LINK}
        className="rounded-xl"
      >
        {buttonText}
      </CardActionButton>
    </div>
  )
})
