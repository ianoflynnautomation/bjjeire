import React from 'react';
import { EventCard } from './EventCard/EventCard';
import { BjjEventDto } from '../../types/event'; 

interface EventsListProps {
  events: BjjEventDto[];
}

const EventsList: React.FC<EventsListProps> = ({ events }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {events.map((event) => (
      <EventCard key={event.id || `event-<span class="math-inline">{event.name}-</span>{Math.random()}`} event={event} />
    ))}
  </div>
);

export default React.memo(EventsList);