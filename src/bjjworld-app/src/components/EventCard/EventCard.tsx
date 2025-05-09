// src/components/EventCard/EventCard.tsx (Simplified version)
import React from 'react';
import { BjjEventDto } from '../../types/event';
import { getEventTypeLabel, getEventTypeColorClasses } from '../../utils/eventUtils';
import { EventSchedule } from './EventSchedule';
import { EventDetails } from './EventDetails'; // Updated EventDetails will be used

import { LinkIcon } from '@heroicons/react/20/solid';

interface EventCardProps {
  event: BjjEventDto;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const eventTypeLabel = getEventTypeLabel(event.type);
  const { name, eventUrl, schedule } = event; // Destructure for easier access

  return (
    <article className="flex h-full flex-col rounded-lg bg-white shadow-lg transition-shadow duration-300 ease-in-out hover:shadow-xl overflow-hidden">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Header: Event Name and Type Badge */}
        <header className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <h3 className="text-xl font-semibold leading-tight text-slate-800 hover:text-indigo-700 transition-colors">
              {eventUrl ? (
                <a href={eventUrl} target="_blank" rel="noopener noreferrer" title={`Visit event page for ${name || 'Unnamed Event'}`}>
                  {name || 'Unnamed Event'}
                </a>
              ) : (
                name || 'Unnamed Event'
              )}
            </h3>
            <span
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${getEventTypeColorClasses(event.type)}`}
            >
              {eventTypeLabel}
            </span>
          </div>
        </header>

        {/* Delegated Details: Location, Cost, Contact Info, Social Media etc. */}
        {/* EventDetails now handles more, including social links and contact website */}
        <div className="mb-4 text-sm"> {/* Removed text-slate-600, let EventDetails handle its own text color */}
          <EventDetails event={event} />
        </div>

        {/* Delegated Schedule: Event Dates/Times */}
        <div className="mb-5">
          <EventSchedule schedule={schedule} />
        </div>

        {/* REMOVED Social Media Links Section from EventCard */}
        {/* This is now handled by EventDetails */}

        <div className="flex-grow"></div>

        {eventUrl && (
          <div className="mt-auto pt-4">
            <a
              href={eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              title={`Get more information about ${name || 'this event'}`}
            >
              <LinkIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              More Information
            </a>
          </div>
        )}
      </div>
    </article>
  );
};