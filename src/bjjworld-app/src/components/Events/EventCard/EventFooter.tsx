import React, { memo } from 'react'
import { LinkIcon } from '@heroicons/react/20/solid'

interface EventFooterProps {
  eventUrl?: string
  eventName: string
}

export const EventFooter: React.FC<EventFooterProps> = memo(({ eventUrl, eventName }) => {
  if (!eventUrl) {
    return null
  }

  return (
    <div className="mt-auto pt-4 bg-emerald-50 rounded-md shadow-sm">
      <a
        href={eventUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="event-footer-link"
        className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out hover:from-emerald-700 hover:to-emerald-800 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        aria-label={`Get more information about ${eventName || 'this event'}`}
      >
        <LinkIcon className="-ml-0.5 h-5 w-5 text-orange-500" aria-hidden="true" />
        More Information
      </a>
    </div>
  )
})
