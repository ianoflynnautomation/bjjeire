import React from 'react';
import { BjjEventDto } from '../../types/event';
import { getEventTypeLabel, getEventTypeColorClasses } from '../../utils/eventUtils';
import { EventSchedule } from './EventSchedule';
import { EventDetails } from './EventDetails';

interface EventCardProps {
  event: BjjEventDto;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const eventTypeLabel = getEventTypeLabel(event.type);

  return (
    <article className="flex flex-col rounded-xl bg-white shadow-md transition-shadow hover:shadow-lg">
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-xl font-semibold text-gray-800">
            {event.name || 'Unnamed Event'}
          </h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getEventTypeColorClasses(event.type)}`}
          >
            {eventTypeLabel}
          </span>
        </div>
        <EventDetails event={event} />
        <EventSchedule schedule={event.schedule} />
        {event.eventUrl && (
          <a
            href={event.eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            More Info
          </a>
        )}
      </div>
    </article>
  );
};