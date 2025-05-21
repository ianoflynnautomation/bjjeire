import React, { memo } from 'react';
import { EventsPageHeaderTestIds } from '../../constants/eventDataTestIds';

interface EventsPageHeaderProps {
  countyName?: string;
  totalEvents?: number;
  dataTestId?: string;
  testIdInstanceSuffix?: string;
}

export const EventsPageHeader: React.FC<EventsPageHeaderProps> = memo(
  ({
    countyName,
    totalEvents,
    dataTestId = EventsPageHeaderTestIds.ROOT(),
    testIdInstanceSuffix = '',
  }) => {
    const title =
      !countyName || countyName.toLowerCase() === 'all'
        ? 'All BJJ Events'
        : `BJJ Events in ${countyName}`;

    const rootTestId = dataTestId;
    const titleTestId = EventsPageHeaderTestIds.TITLE(testIdInstanceSuffix);

    return (
      <header
        className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
        data-testid={rootTestId}
      >
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl"
            data-testid={titleTestId}
          >
            {title}
          </h1>
          {totalEvents !== undefined && totalEvents > 0 && (
            <p
              className="mt-1 text-sm text-slate-600 dark:text-slate-50"
              data-testid={EventsPageHeaderTestIds.TOTAL(testIdInstanceSuffix)}
            >
              Found {totalEvents} event{totalEvents !== 1 ? 's' : ''}.
            </p>
          )}
        </div>
      </header>
    );
  }
);