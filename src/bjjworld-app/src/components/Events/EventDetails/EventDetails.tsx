// src/components/EventDetails/EventDetails.tsx
import React, { memo, useMemo } from 'react'
import { MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/20/solid'
import { BjjEventDto, PricingType } from '../../../types/event'
import { getGoogleMapsUrl } from '../../../utils/mapUtils'
import { calculateEventPrice } from '../../../utils/priceCalculator'
import { CalculatedPrice } from '../../../utils/calculateEventPrice'
import { EventSocialMedia } from '../EventSocialMedia/EventSocialMedia';
import { DetailItem } from './DetailItem'

interface EventDetailsProps {
  event: BjjEventDto
}

const formatPricingDisplay = (
  calculatedPrice: CalculatedPrice,
  originalPricingType: PricingType
): string => {
  if (originalPricingType === PricingType.Free) {
    return 'Free'
  }

  if (calculatedPrice.total === 0) {
    return 'Pricing details unavailable'
  }

  const formattedTotal = calculatedPrice.total.toFixed(2)
  const currencyDisplay = calculatedPrice.currency || ''

  let unitText = ''
  switch (calculatedPrice.unit) {
    case 'weekly':
      unitText = 'per week'
      break
    case 'daily':
      unitText = 'per day'
      break
    case 'session':
      unitText = 'per session'
      break
    case 'event':
    default:
      unitText = ''
      break
  }
  return `${currencyDisplay} ${formattedTotal} ${unitText}`.replace(/\s\s+/g, ' ').trim()
}

export const EventDetails: React.FC<EventDetailsProps> = memo(({ event }) => {
  const { name, address, contact, pricing, schedule } = event

  // Use your specific calculateEventPrice
  const calculatedPrice = useMemo(() => calculateEventPrice(schedule, pricing), [schedule, pricing])

  // Use the refined formatPricingDisplay
  const pricingDisplay = useMemo(
    () => formatPricingDisplay(calculatedPrice, pricing.type),
    [calculatedPrice, pricing.type]
  )

  const hasSocialMedia =
    contact?.socialMedia &&
    Object.values(contact.socialMedia).some(
      (link) => typeof link === 'string' && link.trim() !== ''
    )

    return (
      <section
        className="space-y-3 text-sm text-slate-700"
        aria-labelledby="event-details-heading"
      >
        <h2 id="event-details-heading" className="sr-only">
          Event Details for {name}
        </h2>
  
        {address && (
          <DetailItem icon={<MapPinIcon />} ariaLabel={`Location: ${address}`}>
            <a
              href={getGoogleMapsUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 hover:underline transition-colors"
              aria-label={`View ${name} location on Google Maps`}
            >
              {address}
            </a>
          </DetailItem>
        )}
  
        <DetailItem icon={<CurrencyDollarIcon />} ariaLabel={`Event pricing: ${pricingDisplay}`}>
          {pricingDisplay}
        </DetailItem>
  
        {hasSocialMedia && contact?.socialMedia && (
          <div className="pt-2">
            <EventSocialMedia socialMedia={contact.socialMedia} />
          </div>
        )}
      </section>
    );
  });