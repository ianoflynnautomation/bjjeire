import { memo } from 'react'
import type { JSX } from 'react'
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
}: EventsListProps): JSX.Element {
  const rootTestId = dataTestId ?? EventsPageTestIds.LIST

  return (
    <ul
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center"
      data-testid={rootTestId}
      aria-label="Brazilian Jiu-Jitsu events"
    >
      {events.map(event => (
        <li
          key={event.id ?? `${event.name}-${event.eventUrl ?? ''}`}
          className="w-full"
        >
          <EventCard event={event} data-testid={EventsPageTestIds.LIST_ITEM} />
        </li>
      ))}
    </ul>
  )
})

export default EventsList
