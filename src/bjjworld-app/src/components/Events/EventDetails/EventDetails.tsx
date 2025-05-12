import React, { memo, useMemo } from 'react';
import { MapPinIcon, CurrencyDollarIcon, UserCircleIcon } from '@heroicons/react/20/solid';
import { BjjEventDto, PricingType, OrganizerDto } from '../../../types/event';
import { getGoogleMapsUrl } from '../../../utils/mapUtils';
import { calculateEventPrice } from '../../../utils/priceCalculator';
import { CalculatedPrice } from '../../../utils/calculateEventPrice';
import { EventSocialMedia } from '../EventSocialMedia/EventSocialMedia';
import { DetailItem } from './DetailItem';

interface EventDetailsProps {
  event: BjjEventDto;
  'data-testid'?: string;
}

const formatPricingDisplay = (
  calculatedPrice: CalculatedPrice,
  originalPricingType?: PricingType
): string => {
  if (originalPricingType === PricingType.Free) {
    return 'Free';
  }

  if (calculatedPrice.total === 0) {
    return 'Pricing details unavailable';
  }

  const formattedTotal = calculatedPrice.total.toFixed(2);
  const currencyDisplay = calculatedPrice.currency || '';

  let unitText = '';
  switch (calculatedPrice.unit) {
    case 'PerDay':
      unitText = 'per day';
      break;
    case 'PerSession':
      unitText = 'per session';
      break;
    case 'FlatRate':
    default:
      unitText = '';
      break;
  }
  return `${currencyDisplay ? currencyDisplay + ' ' : ''}${formattedTotal}${unitText ? ' ' + unitText : ''}`.trim();
};

const formatOrganiserDisplay = (organiser: OrganizerDto): string => {
  const url = organiser.website;
  try {
    const parsedUrl = new URL(url);
    // Remove 'www.' and path/query for cleaner display
    return parsedUrl.hostname.replace(/^www\./, '');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // If URL is invalid, return organiser name as fallback
    return organiser.name || url;
  }
};

export const EventDetails: React.FC<EventDetailsProps> = memo(
  ({ event, 'data-testid': baseTestId = 'event-details' }) => {
    const { name, location, socialMedia, pricing, schedule, organiser } = event;

    const calculatedPrice = useMemo(
      () => calculateEventPrice(schedule, pricing),
      [schedule, pricing]
    );

    const pricingDisplay = useMemo(
      () => formatPricingDisplay(calculatedPrice, pricing?.type),
      [calculatedPrice, pricing?.type]
    );

    const organiserDisplay = useMemo(() => formatOrganiserDisplay(organiser), [organiser]);

    const hasSocialMedia = useMemo(
      () =>
        socialMedia &&
        Object.values(socialMedia).some((link) => typeof link === 'string' && link.trim() !== ''),
      [socialMedia]
    );

    return (
      <section
        className="space-y-3 text-sm text-slate-700"
        aria-labelledby="event-details-heading"
        data-testid={baseTestId}
      >
        <h2 id="event-details-heading" className="sr-only">
          Event Details for {name || 'this event'}
        </h2>

        {location?.address && (
          <DetailItem
            icon={<MapPinIcon />}
            ariaLabel={`Location: ${location.address}`}
            data-testid={`${baseTestId}-address`}
          >
            <a
              href={getGoogleMapsUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`${baseTestId}-address-link`}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
              aria-label={`View ${name || 'event'} location on Google Maps`}
            >
              {location.address}
            </a>
          </DetailItem>
        )}

        {organiser && organiserDisplay && (
          <DetailItem
            icon={<UserCircleIcon />}
            ariaLabel={`Organised by: ${organiserDisplay}`}
            data-testid={`${baseTestId}-organiser`}
          >
            <a
              href={organiser.website}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`${baseTestId}-organiser-link`}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
              aria-label={`Visit organiser website for ${name || 'this event'}`}
            >
              Organised by: {organiserDisplay}
            </a>
          </DetailItem>
        )}

        <DetailItem
          icon={<CurrencyDollarIcon />}
          ariaLabel={`Event pricing: ${pricingDisplay}`}
          data-testid={`${baseTestId}-pricing`}
        >
          {pricingDisplay}
        </DetailItem>

        {hasSocialMedia && socialMedia && (
          <div className="pt-2">
            <EventSocialMedia
              socialMedia={socialMedia}
              data-testid={`${baseTestId}-social-media`}
            />
          </div>
        )}
      </section>
    );
  }
);