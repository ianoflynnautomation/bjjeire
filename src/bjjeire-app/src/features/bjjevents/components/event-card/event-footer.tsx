import React, { memo } from 'react'
import { LinkIcon } from '@heroicons/react/20/solid'
import { ensureExternalUrlScheme } from '../../../../utils/formattingUtils'
import { EventCardTestIds } from '../../../../constants/eventDataTestIds'

interface EventFooterProps {
  eventUrl?: string
  eventName: string
}

export const EventFooter: React.FC<EventFooterProps> = memo(
  ({
    eventUrl,
    eventName,
  }) => {
    const externalEventUrl = eventUrl
      ? ensureExternalUrlScheme(eventUrl)
      : undefined

    const isDisabled = !externalEventUrl
    const buttonText = externalEventUrl
      ? 'More Information'
      : 'Information Unavailable'
    const ariaLabel = externalEventUrl
      ? `Get more information about ${eventName || 'this event'}`
      : `No information available for ${eventName || 'this event'}`
    const title = isDisabled
      ? `No website available for ${eventName || 'this bjj event'}`
      : `Visit website for ${eventName || 'this bjj event'}`

    return (
      <div
        className="mt-auto border-t border-slate-200 dark:border-slate-700 pt-3">
        {isDisabled ? (
          <button
            disabled
            aria-disabled="true"
            aria-label={ariaLabel}
            title={title}
            data-testid={EventCardTestIds.BUTTON}
            className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-gray-400 px-3.5 py-2 text-sm font-semibold text-white shadow-sm opacity-50 cursor-not-allowed"
          >
            <LinkIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            {buttonText}
          </button>
        ) : (
          <a
            href={externalEventUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={EventCardTestIds.BUTTON}
            className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-colors"
            aria-label={ariaLabel}
            title={title}
          >
            <LinkIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            {buttonText}
          </a>
        )}
      </div>
    )
  }
)
