import { useMemo } from 'react'
import type { JSX } from 'react'
import {
  MapPinIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from '@heroicons/react/20/solid'
import type { BjjEventDto } from '@/types/event'
import { calculateEventPrices } from '@/utils/price-calculator'
import {
  formatPricingDisplay,
  formatOrganiserDisplay,
} from '@/utils/format-event-details'
import { SocialMediaLinks } from '@/components/ui/social-media/social-media-links'
import { DetailItem } from '@/components/ui/icons/detail-item'
import { getGoogleMapsUrl } from '@/utils/map-utils'
import { ensureExternalUrlScheme } from '@/utils/formatting-utils'
import { EventCardTestIds } from '@/constants/eventDataTestIds'
import { DetailItemTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'

const { card: eventCard } = uiContent.events

interface EventDetailsProps {
  event: BjjEventDto
  'data-testid'?: string
}

export const EventDetails = function EventDetails({
  event,
  'data-testid': sectionDataTestId,
}: EventDetailsProps): JSX.Element {
  const { name, location, socialMedia, pricingOptions, schedule, organiser } =
    event
  const rootTestId = sectionDataTestId ?? DetailItemTestIds.ROOT

  const calculatedPrices = useMemo(
    () => calculateEventPrices(schedule, pricingOptions),
    [schedule, pricingOptions]
  )
  const organiserDisplay = formatOrganiserDisplay(organiser)
  const organiserUrl = ensureExternalUrlScheme(organiser?.website)
  const mapsUrl = getGoogleMapsUrl(location)

  return (
    <section
      className="space-y-2 text-sm"
      aria-labelledby={`event-details-heading-${event.id ?? event.name}`}
      data-testid={rootTestId}
    >
      <h4
        id={`event-details-heading-${event.id ?? event.name}`}
        className="sr-only"
      >
        {eventCard.detailsSrLabel} {name || eventCard.fallbackRef}
      </h4>

      {location && (
        <DetailItem
          icon={<MapPinIcon />}
          ariaLabel={`Location: ${location.address || location.venue || 'Details unavailable'}`}
          data-testid={EventCardTestIds.ADDRESS}
        >
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm text-slate-600 underline-offset-2 transition-colors hover:text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 dark:text-slate-300 dark:hover:text-primary-400"
              aria-label={`View ${name || 'event'} location on Google Maps`}
              data-testid={EventCardTestIds.ADDRESS_LINK}
            >
              {location.address || location.venue || eventCard.viewOnMap}
            </a>
          ) : (
            <span data-testid={EventCardTestIds.ADDRESS_LINK}>
              {location.address || location.venue || eventCard.viewOnMap}
            </span>
          )}
        </DetailItem>
      )}

      {organiserDisplay && (
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
              className="rounded-sm text-slate-600 underline-offset-2 transition-colors hover:text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 dark:text-slate-300 dark:hover:text-primary-400"
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

      {calculatedPrices.map((price, index) => {
        const pricingDisplay = formatPricingDisplay(price)
        return (
          <DetailItem
            key={`${price.label ?? price.unit}-${index}`}
            icon={<CurrencyDollarIcon />}
            ariaLabel={`Event pricing: ${pricingDisplay}`}
            data-testid={EventCardTestIds.PRICING}
          >
            {pricingDisplay}
          </DetailItem>
        )
      })}

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
