import React, { memo } from 'react'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'
import { uiContent } from '@/config/ui-content'

const { pageTitle } = uiContent.events

interface EventsPageHeaderProps {
  countyName?: string
  totalEvents?: number
  dataTestId?: string
}

export const EventsPageHeader: React.FC<EventsPageHeaderProps> = memo(
  ({ countyName, totalEvents, dataTestId = EventsPageTestIds.HEADER }) => {
    const title =
      !countyName || countyName.toLowerCase() === 'all'
        ? pageTitle.all
        : `${pageTitle.prefix} ${countyName}`
    const totalEventsLabel =
      totalEvents !== undefined
        ? `Found ${totalEvents} event${totalEvents !== 1 ? 's' : ''}.`
        : ''

    const rootTestId = dataTestId
    const titleTestId = EventsPageTestIds.HEADER_TITLE

    return (
      <header
        className="relative mb-8 overflow-hidden rounded-3xl bg-slate-800/40 px-5 py-6 backdrop-blur-sm ring-1 ring-white/[0.08] sm:px-7"
        data-testid={rootTestId}
      >
        {/* Subtle Irish tricolor top accent */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-white/30 to-orange-500"
          aria-hidden="true"
        />
        <div
          className="absolute -right-12 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-10 left-16 h-28 w-28 rounded-full bg-orange-500/10 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative">
          <h1
            className="text-3xl font-black tracking-tight text-white sm:text-4xl"
            data-testid={titleTestId}
          >
            {title}
          </h1>
          {totalEvents !== undefined && totalEvents > 0 && (
            <p
              className="mt-3 inline-flex items-center rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30"
              data-testid={EventsPageTestIds.HEADER_TOTAL}
              aria-live="polite"
            >
              {totalEventsLabel}
            </p>
          )}
        </div>
      </header>
    )
  }
)
