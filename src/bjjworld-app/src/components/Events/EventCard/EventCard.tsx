import React, { memo } from 'react'
import { BjjEventDto } from '../../../types/event'
import { EventSchedule } from '../EventSchedule/EventSchedule'
import { EventDetails } from '../EventDetails/EventDetails'
import { EventHeader } from './EventHeader'
import { EventFooter } from './EventFooter'

interface EventCardProps {
  event: BjjEventDto
}

export const EventCard: React.FC<EventCardProps> = memo(({ event }) => {
  const { name, eventUrl, schedule, type } = event

  return (
    <article
      data-testid={`event-card-${name}`}
      className="
        flex h-full flex-col rounded-lg 
        bg-white border-emerald-200
        shadow-sm transition-shadow duration-200 ease-in-out 
        hover:hover:bg-emerald-50 hover:border-emerald-200
        overflow-hidden
      "
    >
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <EventHeader name={name} eventUrl={eventUrl} type={type} data-testid="event-header" />

        {/* Event Details Section */}
        <div data-testid="event-details" className="mb-3 text-sm text-slate-700">
          <EventDetails event={event} data-testid="event-details-content" />
        </div>

        {/* Event Schedule Section */}
        {schedule && (
          <div data-testid="event-schedule" className="mb-4">
            <EventSchedule schedule={schedule} data-testid="event-schedule-content" />
          </div>
        )}

        {/* Spacer to push footer down */}
        <div className="flex-grow" />

        {/* Event Footer Section */}
        <EventFooter eventUrl={eventUrl} eventName={name} data-testid="event-footer" />
      </div>
    </article>
  )
})
