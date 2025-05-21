import React, { memo } from 'react'
import { BjjEventType } from '../../../types/event'
import {
  getEventTypeLabel,
  getEventTypeColorClasses,
} from '../../../utils/eventUtils'
import { EventCardTestIds } from '../../../constants/eventDataTestIds'
import { withTestIdSuffix } from '../../../constants/commonDataTestIds'

interface EventHeaderProps {
  name: string
  type: BjjEventType
  'data-testid'?: string
  testIdInstanceSuffix?: string
}

export const EventHeader: React.FC<EventHeaderProps> = memo(
  ({
    name,
    type,
    'data-testid': baseTestId = EventCardTestIds.HEADER.ROOT(),
    testIdInstanceSuffix = '',
  }) => {
    const eventTypeLabel = getEventTypeLabel(type)
    const displayName = name || 'Unnamed Event'

    return (
      <header className="mb-4" data-testid={baseTestId}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <h3
            data-testid={withTestIdSuffix(
              EventCardTestIds.HEADER.NAME,
              testIdInstanceSuffix
            )}
            className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100 transition-colors"
            aria-label={`Event name: ${displayName}`}
          >
            {displayName}
          </h3>
          {eventTypeLabel && (
            <span
              data-testid={withTestIdSuffix(
                EventCardTestIds.HEADER.TYPE,
                testIdInstanceSuffix
              )}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${getEventTypeColorClasses(
                type
              )}`}
              aria-label={`Event type: ${eventTypeLabel}`}
            >
              {eventTypeLabel}
            </span>
          )}
        </div>
      </header>
    )
  }
)
