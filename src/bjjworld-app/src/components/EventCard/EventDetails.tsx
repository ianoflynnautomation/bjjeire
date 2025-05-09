import React from 'react';
import { BjjEventDto } from '../../types/event';
import { getGoogleMapsUrl } from '../../utils/mapUtils';
import { EventSocialMedia } from './EventSocialMedia';

interface EventDetailsProps {
  event: BjjEventDto;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ event }) => {
  return (
    <div className="mb-4 space-y-2 text-sm text-gray-600">
      {event.address && (
        <p className="flex items-center">
          <svg
            className="mr-2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <a
            href={getGoogleMapsUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {event.address}
          </a>
        </p>
      )}
      <p className="flex items-center">
        <svg
          className="mr-2 h-4 w-4 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.736-11.021C9.792 6.193 10.304 6 11 6s1.208.193 1.736.979a1 1 0 101.715-1.029C13.721 4.784 12.232 4 11 4s-2.721.784-3.451 1.95A1 1 0 109.264 6.979z"
            clipRule="evenodd"
          />
        </svg>
        {event.cost ? `$${event.cost}` : 'Free'}
      </p>
      {event.contact?.website && (
        <p className="flex items-center">
          <svg
            className="mr-2 h-4 w-4 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 2a8 8 0 100 16 8 8 0 000-16zm-5.917 7h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zm9.834 0h-1.946c-.454-1.147-.748-2.572-.837-4.118A6.004 6.004 0 0115.917 9z"
              clipRule="evenodd"
            />
          </svg>
          <a
            href={event.contact.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {event.contact.website}
          </a>
        </p>
      )}
      <EventSocialMedia socialMedia={event.contact?.socialMedia} />
    </div>
  );
};