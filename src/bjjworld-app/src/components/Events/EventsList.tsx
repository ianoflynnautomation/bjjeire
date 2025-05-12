import React from 'react'
import { EventCard } from './EventCard/EventCard'
import { BjjEventDto } from '../../types/event'

interface EventsListProps {
  events: BjjEventDto[]
  'data-testid'?: string
}

const EventsList: React.FC<EventsListProps> = ({
  events,
  'data-testid': baseTestId = 'events-list',
}) => {
  if (!events || events.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid={baseTestId}>
      {events.map((event, index) => (
        <EventCard
          key={event.id || `event-card-${index}`}
          event={event}
          data-testid={`${baseTestId}-item-${event.id || index}`}
        />
      ))}
    </div>
  )
}

export default React.memo(EventsList)
