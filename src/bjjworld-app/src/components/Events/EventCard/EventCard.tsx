import React, { memo } from 'react'
import { BjjEventDto } from '../../../types/event'
import { EventSchedule } from './../EventSchedule/EventSchedule'
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
      className="
    flex h-full flex-col rounded-lg 
    bg-white border-emerald-200
    shadow-sm transition-shadow duration-200 ease-in-out 
    hover:hover:bg-emerald-50 hover:border-emerald-200
    overflow-hidden
      "
    >
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <EventHeader name={name} eventUrl={eventUrl} type={type} />

        {/* Event Details Section */}
        <div className="mb-3 text-sm text-slate-700">
          <EventDetails event={event} />
        </div>

        {/* Event Schedule Section */}
        {schedule && (
          <div className="mb-4">
            <EventSchedule schedule={schedule} />
          </div>
        )}

        {/* Spacer to push footer down */}
        <div className="flex-grow" />

        {/* Event Footer Section */}
        <EventFooter eventUrl={eventUrl} eventName={name} />
      </div>
    </article>
  )
})
