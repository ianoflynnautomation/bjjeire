import { memo } from 'react'
import type { BjjEventDto } from '@/types/event'
import { EventSchedule, EventDetails, EventHeader, EventFooter } from '.'
import {
  EventsPageTestIds,
  EventCardTestIds,
} from '@/constants/eventDataTestIds'
import { Card, CardContent } from '@/components/ui/card/card'

interface EventCardProps {
  event: BjjEventDto
  'data-testid'?: string
}

export const EventCard = memo(function EventCard({
  event,
  'data-testid': dataTestId,
}: EventCardProps) {
  const { name, eventUrl, schedule, type, county, imageUrl } = event
  const headingId = `event-card-heading-${event.id ?? name.replaceAll(/\s+/gu, '-').toLowerCase()}`
  const rootTestId = dataTestId ?? EventsPageTestIds.LIST_ITEM

  return (
    <Card
      className="relative isolate focus-within:ring-2 focus-within:ring-emerald-500/60"
      data-testid={rootTestId}
      role="listitem"
      aria-labelledby={headingId}
    >
      <EventHeader
        name={name}
        type={type}
        county={county}
        imageUrl={imageUrl}
        headingId={headingId}
      />

      <CardContent>
        <div className="mb-4">
          <EventDetails event={event} />
        </div>

        {schedule && (
          <div
            className="mb-4 text-sm text-slate-300"
            data-testid={EventCardTestIds.SCHEDULE}
          >
            <EventSchedule schedule={schedule} />
          </div>
        )}

        <EventFooter eventUrl={eventUrl} eventName={name} />
      </CardContent>
    </Card>
  )
})
