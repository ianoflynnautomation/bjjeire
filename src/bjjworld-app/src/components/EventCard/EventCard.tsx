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
    <article className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-2xl duration-300 ease-in-out">
      <div className="p-5 sm:p-6 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl lg:text-2xl font-semibold text-gray-800 leading-tight">
            {event.name || 'Unnamed Event'}
          </h3>
          <span
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${getEventTypeColorClasses(
              event.type
            )}`}
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
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            More Information
          </a>
        )}
      </div>
    </article>
  );
};