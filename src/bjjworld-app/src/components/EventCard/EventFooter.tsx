// src/components/EventCard/EventFooter.tsx
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
    <div className="mt-auto pt-4">
      {' '}
      {/* mt-auto pushes it to the bottom */}
      <a
        href={eventUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus-visible:outline-indigo-500"
        aria-label={`Get more information about ${eventName || 'this event'}`}
      >
        <LinkIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
        More Information
      </a>
    </div>
  )
})
