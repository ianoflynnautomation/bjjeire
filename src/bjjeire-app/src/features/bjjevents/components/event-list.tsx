import type { CSSProperties, JSX } from 'react'
import { EventCard } from './event-card'
import type { BjjEventDto } from '@/types/event'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'
import { uiContent } from '@/config/ui-content'

interface EventsListProps {
  events: BjjEventDto[]
  'data-testid'?: string
}

export const EventsList = function EventsList({
  events,
  'data-testid': dataTestId,
}: EventsListProps): JSX.Element {
  const rootTestId = dataTestId ?? EventsPageTestIds.LIST

  return (
    <ul
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center"
      data-testid={rootTestId}
      aria-label={uiContent.events.list.ariaLabel}
    >
      {events.map((event, index) => (
        <li
          key={event.id}
          className="w-full animate-rise"
          style={{ '--i': index } as CSSProperties}
        >
          <EventCard event={event} data-testid={EventsPageTestIds.LIST_ITEM} />
        </li>
      ))}
    </ul>
  )
}
