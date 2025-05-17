import React, { memo } from 'react'
import { LinkIcon } from '@heroicons/react/20/solid'
import { ensureExternalUrlScheme } from '../../../utils/formattingUtils'

interface EventFooterProps {
  eventUrl?: string
  eventName: string
}

export const EventFooter: React.FC<EventFooterProps> = memo(
  ({ eventUrl, eventName }) => {
    if (!eventUrl) {
      return null
    }
    const externalEventUrl = ensureExternalUrlScheme(eventUrl)

    return (
      <div className="mt-auto border-t border-slate-200 dark:border-slate-700 pt-3">
        <a
          href={externalEventUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="event-footer-link"
          className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out hover:from-emerald-700 hover:to-emerald-800 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700" // UPDATED: Matched GymFooter button, added dark mode, adjusted padding
          aria-label={`Get more information about ${eventName || 'this event'}`}
        >
          <LinkIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          More Information
        </a>
      </div>
    )
  }
)
