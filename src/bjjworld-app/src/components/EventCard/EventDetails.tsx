import React, { memo, useMemo } from 'react';
import { BjjEventDto, PricingType } from '../../types/event';
import { getGoogleMapsUrl } from '../../utils/mapUtils';
import { calculateEventPrice } from '../../utils/priceCalculator';
import { EventSocialMedia } from './EventSocialMedia';
import { MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/20/solid';

// Props for the reusable DetailItem component
interface DetailItemProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// Reusable component for displaying an icon and content
const DetailItem: React.FC<DetailItemProps> = memo(({ icon, children, className }) => (
  <div className={`flex items-start gap-x-2 text-slate-600 ${className || ''}`}>
    <span className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true">
      {icon}
    </span>
    <div className="flex-grow">{children}</div>
  </div>
));

// Props for the EventDetails component
interface EventDetailsProps {
  event: BjjEventDto;
}

// Main component to display event details (address, pricing, social media)
export const EventDetails: React.FC<EventDetailsProps> = memo(({ event }) => {
  const { address, contact, pricing, schedule } = event;

  // Calculate dynamic pricing based on schedule and pricing model
  const { total, unit, currency } = useMemo(
    () => calculateEventPrice(schedule, pricing),
    [schedule, pricing]
  );

  // Format pricing display based on PricingType and calculated price
  const pricingDisplay = useMemo(() => {
    if (pricing.type === PricingType.Free) {
      return 'Free';
    }
    const formattedTotal = total.toFixed(2);
    const unitText = unit === 'event' ? '' : `per ${unit}`;
    return `${currency} ${formattedTotal} ${unitText}`.trim();
  }, [total, unit, currency, pricing.type]);

  return (
    <section className="space-y-3 text-sm" aria-labelledby="event-details-heading">
      <h2 id="event-details-heading" className="sr-only">
        Event Details
      </h2>

      {address && (
        <DetailItem icon={<MapPinIcon />}>
          <a
            href={getGoogleMapsUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 hover:underline transition-colors"
            aria-label={`View ${event.name} location on Google Maps`}
          >
            {address}
          </a>
        </DetailItem>
      )}

      <DetailItem icon={<CurrencyDollarIcon />}>
        <span aria-label={`Event pricing: ${pricingDisplay}`}>{pricingDisplay}</span>
      </DetailItem>

      {contact?.socialMedia && Object.values(contact.socialMedia).some((link) => !!link) && (
        <div className="pt-2">
          <EventSocialMedia socialMedia={contact.socialMedia} />
        </div>
      )}
    </section>
  );
});