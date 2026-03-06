import { memo } from 'react'
import { EventCard } from './event-card'
import type { BjjEventDto } from '@/types/event'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'

interface EventsListProps {
  events: BjjEventDto[]
  'data-testid'?: string
}

const EventsList = memo(function EventsList({
  events,
  'data-testid': dataTestId,
}: EventsListProps) {
  const rootTestId = dataTestId || EventsPageTestIds.LIST

  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center"
      data-testid={rootTestId}
      role="list"
      aria-label="Brazilian Jiu-Jitsu events"
    >
      {events.map(event => (
        <EventCard
          key={event.id ?? `${event.name}-${event.eventUrl ?? ''}`}
          event={event}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      ))}
    </div>
  )
})

export default EventsList
