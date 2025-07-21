import React, { memo } from 'react'
import { BjjEventType } from '../../../../types/event'
import {
  getEventTypeLabel,
  getEventTypeColorClasses,
} from '../../../../utils/eventUtils'
import { EventCardTestIds } from '../../../../constants/eventDataTestIds'
import { MapPinIcon } from '@heroicons/react/20/solid'

interface EventHeaderProps {
  name: string
  type: BjjEventType
  county: string
}

export const EventHeader: React.FC<EventHeaderProps> = memo(
  ({ name, type, county }) => {
    const eventTypeLabel = getEventTypeLabel(type)
    const displayName = name || 'Unnamed Event'

    return (
      <header className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <h3
            data-testid={EventCardTestIds.NAME}
            className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100 transition-colors"
            aria-label={`Event name: ${displayName}`}
          >
            {displayName}
          </h3>
          {eventTypeLabel && (
            <span
              data-testid={EventCardTestIds.TYPE}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${getEventTypeColorClasses(
                type
              )}`}
              aria-label={`Event type: ${eventTypeLabel}`}
            >
              {eventTypeLabel}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center text-slate-500 dark:text-slate-400">
          <MapPinIcon
            className="mr-1.5 h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          />
          <span
            data-testid={EventCardTestIds.COUNTY}
            className="text-sm"
            aria-label={`Event county: ${county}`}
          >
            {county} County
          </span>
        </div>
      </header>
    )
  }
)