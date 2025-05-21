import React, { memo } from 'react'
import { LinkIcon } from '@heroicons/react/20/solid'
import { ensureExternalUrlScheme } from '../../../utils/formattingUtils'
import { EventCardTestIds } from '../../../constants/eventDataTestIds'
import { withTestIdSuffix } from '../../../constants/commonDataTestIds'

interface EventFooterProps {
  eventUrl?: string;
  eventName: string;
  dataTestId?: string;
  testIdInstanceSuffix?: string;
}

export const EventFooter: React.FC<EventFooterProps> = memo(
  ({
    eventUrl,
    eventName,
    dataTestId = EventCardTestIds.FOOTER.ROOT(),
    testIdInstanceSuffix = '',
  }) => {
    const externalEventUrl = eventUrl ? ensureExternalUrlScheme(eventUrl) : undefined;
    const actualRootDataTestId = dataTestId;
    const eventLinkTestId = withTestIdSuffix(
      EventCardTestIds.FOOTER.LINK,
      testIdInstanceSuffix
    );

    // Determine button state
    const isDisabled = !externalEventUrl;
    const buttonText = externalEventUrl ? 'More Information' : 'Information Unavailable';
    const ariaLabel = externalEventUrl
      ? `Get more information about ${eventName || 'this event'}`
      : `No information available for ${eventName || 'this event'}`;

    return (
      <div
        className="mt-auto border-t border-slate-200 dark:border-slate-700 pt-3"
        data-testid={actualRootDataTestId}
      >
        {isDisabled ? (
          <button
            disabled
            aria-disabled="true"
            aria-label={ariaLabel}
            title="No website available for this event"
            data-testid={eventLinkTestId}
            className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-gray-400 px-3.5 py-2 text-sm font-semibold text-white shadow-sm opacity-50 cursor-not-allowed"
          >
            <LinkIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            {buttonText}
          </button>
        ) : (
          <a
            href={externalEventUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={eventLinkTestId}
            className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-colors"
            aria-label={ariaLabel}
          >
            <LinkIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            {buttonText}
          </a>
        )}
      </div>
    );
  }
);