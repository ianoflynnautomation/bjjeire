import React, { memo } from 'react';
import { BjjEventType } from '../../../types/event';
import { getEventTypeLabel, getEventTypeColorClasses } from '../../../utils/eventUtils';

interface EventHeaderProps {
  name: string;
  eventUrl?: string;
  type: BjjEventType;
}

export const EventHeader: React.FC<EventHeaderProps> = memo(({ name, eventUrl, type }) => {
  const eventTypeLabel = getEventTypeLabel(type);
  const displayName = name || 'Unnamed Event';

  return (
    <header className="mb-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <h3 className="text-xl font-semibold leading-tight text-slate-800 transition-colors">
          {eventUrl ? (
            <a
              href={eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit event page for ${displayName}`}
              className="hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              {displayName}
            </a>
          ) : (
            displayName
          )}
        </h3>
        {eventTypeLabel && (
          <span
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${getEventTypeColorClasses(type)}`}
            aria-label={`Event type: ${eventTypeLabel}`}
          >
            {eventTypeLabel}
          </span>
        )}
      </div>
    </header>
  );
});