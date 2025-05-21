import React from 'react'
import { EventCard } from './EventCard'
import { BjjEventDto } from '../../types/event'
import { EventsListTestIds } from '../../constants/eventDataTestIds'

interface EventsListProps {
  events: BjjEventDto[]
  'data-testid'?: string
  testIdInstanceSuffix?: string
}

const EventsList: React.FC<EventsListProps> = ({
  events,
  'data-testid': dataTestId,
  testIdInstanceSuffix = '',
}) => {
  if (!events || events.length === 0) {
    return null
  }

  const rootTestId = dataTestId || EventsListTestIds.ROOT(testIdInstanceSuffix)

  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"
      data-testid={rootTestId}
    >
      {events.map((event, index) => {
        return (
          <EventCard
            key={event.id || `event-card-list-item-${index}`}
            event={event}
            data-testid={EventsListTestIds.ITEM(event.id || index.toString())}
          />
        )
      })}
    </div>
  )
}

export default React.memo(EventsList)
