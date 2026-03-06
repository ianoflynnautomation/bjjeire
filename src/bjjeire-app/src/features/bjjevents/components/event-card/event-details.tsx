import React, { memo, useMemo } from 'react'
import {
  MapPinIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from '@heroicons/react/20/solid'
import type { BjjEventDto, OrganizerDto } from '@/types/event';
import { PricingType } from '@/types/event'
import { calculateEventPrice } from '@/utils/priceCalculator'
import type { CalculatedPrice } from '@/utils/priceCalculator'
import { SocialMediaLinks } from '@/components/ui/social-media/social-media-links'
import { DetailItem } from '@/components/ui/icons/detail-item'
import { getGoogleMapsUrl } from '@/utils/mapUtils'
import { ensureExternalUrlScheme } from '@/utils/formattingUtils'
import { EventCardTestIds } from '@/constants/eventDataTestIds'
import { DetailItemTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'

const { card: eventCard } = uiContent.events

const formatPricingDisplay = (
  calculatedPrice: CalculatedPrice,
  originalPricingType?: PricingType
): string => {
  if (originalPricingType === PricingType.Free) {
    return eventCard.pricingFree
  }
  if (calculatedPrice.total === 0 && originalPricingType === undefined) {
    return eventCard.pricingUnavailable
  }
  const formattedTotal = calculatedPrice.total.toFixed(2)
  const currencyDisplay = calculatedPrice.currency || ''
  let unitText = ''
  switch (calculatedPrice.unit) {
    case 'PerDay':
      unitText = eventCard.pricingPerDay
      break
    case 'PerSession':
      unitText = eventCard.pricingPerSession
      break
    case 'FlatRate':
    default:
      unitText = ''
      break
  }
  return `${currencyDisplay ? currencyDisplay + ' ' : ''}${formattedTotal}${unitText ? ' ' + unitText : ''}`.trim()
}

const formatOrganiserDisplay = (
  organiser?: OrganizerDto
): string | undefined => {
  if (!organiser || (!organiser.name && !organiser.website)) {return undefined}
  const url = organiser.website
  if (url) {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.hostname.replace(/^www\./, '')
    } catch {
      return (
        organiser.name || url.replace(/^https?:\/\//, '').replace(/^www\./, '')
      )
    }
  }
  return organiser.name
}

interface EventDetailsProps {
  event: BjjEventDto
  'data-testid'?: string
}

export const EventDetails: React.FC<EventDetailsProps> = memo(
  ({ event, 'data-testid': sectionDataTestId }) => {
    const { name, location, socialMedia, pricing, schedule, organiser } = event
    const rootTestId = sectionDataTestId || DetailItemTestIds.ROOT

    const calculatedPrice = useMemo(
      () => calculateEventPrice(schedule, pricing),
      [schedule, pricing]
    )

    const pricingDisplay = useMemo(
      () => formatPricingDisplay(calculatedPrice, pricing?.type),
      [calculatedPrice, pricing?.type]
    )

    const organiserDisplay = useMemo(
      () => formatOrganiserDisplay(organiser),
      [organiser]
    )
    const organiserUrl = ensureExternalUrlScheme(organiser?.website)

    return (
      <section
        className="space-y-2 text-sm"
        aria-labelledby={`event-details-heading-${event.id || event.name}`}
        data-testid={rootTestId}
      >
        <h2
          id={`event-details-heading-${event.id || event.name}`}
          className="sr-only"
        >
          Event Details for {name || 'this event'}
        </h2>

        {location && (
          <DetailItem
            icon={<MapPinIcon />}
            ariaLabel={`Location: ${location.address || location.venue || 'Details unavailable'}`}
            // DetailItem's root test ID
            data-testid={EventCardTestIds.ADDRESS}

          >
            <a
              href={getGoogleMapsUrl(location)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm text-slate-300 underline-offset-2 transition-colors hover:text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
              aria-label={`View ${name || 'event'} location on Google Maps`}
              data-testid={EventCardTestIds.ADDRESS_LINK}
            >
              {location.address || location.venue || eventCard.viewOnMap}
            </a>
          </DetailItem>
        )}

        {organiser && organiserDisplay && (
          <DetailItem
            icon={<UserCircleIcon />}
            ariaLabel={`Organised by: ${organiserDisplay}`}
            data-testid={EventCardTestIds.ORGANISER}
          >
            {organiserUrl ? (
              <a
                href={organiserUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm text-slate-300 underline-offset-2 transition-colors hover:text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
                aria-label={`Visit organiser website for ${name || 'this event'}`}
                data-testid={EventCardTestIds.ORGANISER_LINK}
              >
                {eventCard.organisedByLabel}: {organiserDisplay}
              </a>
            ) : (
              <span data-testid={EventCardTestIds.ORGANISER_LINK}>
                {eventCard.organisedByLabel}: {organiserDisplay}
              </span>
            )}
          </DetailItem>
        )}

        {pricingDisplay && (
          <DetailItem
            icon={<CurrencyDollarIcon />}
            ariaLabel={`Event pricing: ${pricingDisplay}`}
            data-testid={EventCardTestIds.PRICING}
          >
            {pricingDisplay}
          </DetailItem>
        )}

        {socialMedia && (
          <div className="pt-1">
            <SocialMediaLinks
              socialMedia={socialMedia}
              data-testid={EventCardTestIds.SOCIAL_MEDIA}
            />
          </div>
        )}
      </section>
    )
  }
)
