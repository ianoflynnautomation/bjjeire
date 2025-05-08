// src/components/EventCard.tsx
import React from 'react';
import { BjjEventDto, BJJ_EVENT_TYPES, BjjEventType } from '../types/event'; 

interface EventCardProps {
  event: BjjEventDto;
  onViewOnMap: (coordinates: BjjEventDto['coordinates']) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onViewOnMap }) => {
  // event.type is BjjEventType (number)
  const eventTypeInfo = BJJ_EVENT_TYPES.find((t) => t.value === event.type);
  const eventTypeLabel = eventTypeInfo?.label || 'Event';

  const getEventTypeColorClasses = (eventType: BjjEventType) => {
    switch (eventType) {
      case BjjEventType.OpenMat: return 'bg-green-100 text-green-700';
      case BjjEventType.Camp: return 'bg-purple-100 text-purple-700';
      case BjjEventType.Tournament: return 'bg-red-100 text-red-700';
      case BjjEventType.Seminar: return 'bg-yellow-100 text-yellow-700';
      case BjjEventType.Other: return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <article className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-2xl duration-300 ease-in-out">
      <div className="p-5 sm:p-6 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl lg:text-2xl font-semibold text-gray-800 leading-tight">
            {event.eventName || 'Unnamed Event'}
          </h3>
          <span
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${getEventTypeColorClasses(event.type)}`}
          >
            {eventTypeLabel}
          </span>
        </div>

        <div className="space-y-2.5 text-sm text-gray-600 mb-4">
          {event.coordinates?.placeName && (
            <p className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {event.coordinates.placeName}
            </p>
          )}
          {event.address && (
             <p className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
               {event.address}
             </p>
          )}
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Cost: {event.cost != null ? (event.cost === 0 ? 'Free' : `$${event.cost}`) : 'Not specified'}
          </p>
          {event.contact?.email && (
            <p className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {event.contact.email}
            </p>
          )}
        </div>

        {event.bjjEventHours && event.bjjEventHours.length > 0 ? (
          <div className="mb-4 text-sm">
            <p className="font-semibold text-gray-700 mb-1">Schedule:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-0.5">
              {event.bjjEventHours.slice(0, 3).map((hour, index) => (
                <li key={index}>
                  <span className="font-medium">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][hour.day]}:</span> {hour.openTime} - {hour.closeTime}
                </li>
              ))}
              {event.bjjEventHours.length > 3 && <li className="text-xs">...and more</li>}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic mb-4">No schedule provided.</p>
        )}
      </div>

      <div className="p-5 sm:p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => event.coordinates && onViewOnMap(event.coordinates)}
          disabled={!event.coordinates || (event.coordinates.latitude == null || event.coordinates.longitude == null)}
          className="w-full px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12 1.5a.5.5 0 01.5.5v2.5a.5.5 0 01-1 0V2a.5.5 0 01.5-.5zM10 0a.5.5 0 01.5.5v2a.5.5 0 01-1 0V.5A.5.5 0 0110 0zM8 1.5a.5.5 0 01.5-.5h.09a.5.5 0 010 1H8.5a.5.5 0 01-.5-.5zM5.701 2.013a.5.5 0 01.707-.707l1.768 1.768a.5.5 0 11-.707.707L5.7 2.013zm8.598 0a.5.5 0 00-.707-.707L11.823 3.07a.5.5 0 00.707.707l1.769-1.767zM18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-7a.5.5 0 00-.5.5v1a.5.5 0 001 0V3.5a.5.5 0 00-.5-.5zM5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
           </svg>
          View on Google Maps
        </button>
      </div>
    </article>
  );
};

export default EventCard;