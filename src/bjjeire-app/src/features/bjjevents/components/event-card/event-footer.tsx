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

export const EventFooter = function EventFooter({
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
    ? `${eventCard.moreInfoAriaPrefix} ${fallback}`
    : `${eventCard.noInfoAriaPrefix} ${fallback}`
  const title = externalEventUrl
    ? `${uiContent.shared.visitWebsiteFor} ${fallback}`
    : `${uiContent.shared.noWebsiteFor} ${fallback}`

  return (
    <div className="mt-auto border-t border-hairline pt-3">
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
}
