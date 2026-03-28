import { memo } from 'react'
import type { JSX } from 'react'
import { LinkIcon } from '@heroicons/react/20/solid'
import { ensureExternalUrlScheme } from '@/utils/formatting-utils'
import { EventCardTestIds } from '@/constants/eventDataTestIds'
import { uiContent } from '@/config/ui-content'
import { CardActionButton } from '@/components/ui/button/button'

const { card: eventCard } = uiContent.events

interface EventFooterProps {
  eventUrl?: string
  eventName: string
}

export const EventFooter = memo(function EventFooter({
  eventUrl,
  eventName,
}: EventFooterProps): JSX.Element {
  const externalEventUrl = eventUrl
    ? ensureExternalUrlScheme(eventUrl)
    : undefined

  const fallback = eventName || eventCard.fallbackRef
  const buttonText = externalEventUrl
    ? eventCard.moreInfoButton
    : eventCard.noInfoButton
  const ariaLabel = externalEventUrl
    ? `Get more information about ${fallback}`
    : `No information available for ${fallback}`
  const title = externalEventUrl
    ? `Visit website for ${fallback}`
    : `No website available for ${fallback}`

  return (
    <div className="mt-auto border-t border-black/8 pt-3 dark:border-white/8">
      <CardActionButton
        href={externalEventUrl}
        icon={<LinkIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />}
        aria-label={ariaLabel}
        title={title}
        data-testid={EventCardTestIds.BUTTON}
        className="rounded-xl"
      >
        {buttonText}
      </CardActionButton>
    </div>
  )
})
