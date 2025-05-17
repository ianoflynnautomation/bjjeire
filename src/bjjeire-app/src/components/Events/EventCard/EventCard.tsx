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
        bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-800
        shadow-lg transition-all duration-300 ease-in-out
        hover:shadow-emerald-200/50 dark:hover:shadow-emerald-700/30 hover:-translate-y-1
        overflow-hidden group"
    >
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <EventHeader name={name} type={type} data-testid="event-header" />

        {/* Event Details Section */}
        <div data-testid="event-details" className="mb-4">
          {' '}
          {/* Adjusted margin */}
          <EventDetails event={event} data-testid="event-details-content" />
        </div>

        {/* Event Schedule Section */}
        {schedule && (
          <div
            data-testid="event-schedule"
            className="mb-4 text-sm text-slate-600 dark:text-slate-300"
          >
            <EventSchedule
              schedule={schedule}
              data-testid="event-schedule-content"
            />
          </div>
        )}

        {/* Spacer to push footer down */}
        <div className="flex-grow" />

        {/* Event Footer Section */}
        <EventFooter
          eventUrl={eventUrl}
          eventName={name}
          data-testid="event-footer"
        />
      </div>
    </article>
  )
})
