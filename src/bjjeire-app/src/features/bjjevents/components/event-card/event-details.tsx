import React, { memo, useMemo } from 'react'
import {
  MapPinIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from '@heroicons/react/20/solid'
import { BjjEventDto, PricingType, OrganizerDto } from '../../../../types/event'
import { calculateEventPrice } from '../../../../utils/priceCalculator'
import { CalculatedPrice } from '../../../../utils/priceCalculator'
import { SocialMediaLinks } from '../../../../components/ui/social-media/social-media-links'
import { DetailItem } from './detail-item'
import { getGoogleMapsUrl } from '../../../../utils/mapUtils'
import { ensureExternalUrlScheme } from '../../../../utils/formattingUtils'
import { EventCardTestIds } from '../../../../constants/eventDataTestIds'

const formatPricingDisplay = (
  calculatedPrice: CalculatedPrice,
  originalPricingType?: PricingType
): string => {
  if (originalPricingType === PricingType.Free) {
    return 'Free'
  }
  if (calculatedPrice.total === 0 && originalPricingType === undefined) {
    return 'Pricing details unavailable'
  }
  const formattedTotal = calculatedPrice.total.toFixed(2)
  const currencyDisplay = calculatedPrice.currency || ''
  let unitText = ''
  switch (calculatedPrice.unit) {
    case 'PerDay':
      unitText = 'per day'
      break
    case 'PerSession':
      unitText = 'per session'
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
  if (!organiser || (!organiser.name && !organiser.website)) return undefined
  const url = organiser.website
  if (url) {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.hostname.replace(/^www\./, '')
    } catch (error) {
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
  ({
    event, 'data-testid': sectionDataTestId }) => {
    const { name, location, socialMedia, pricing, schedule, organiser } = event

    const rootTestId =
      sectionDataTestId || EventCardTestIds.DETAILS.ROOT


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

    return (
      <section
        className="space-y-2.5 text-sm"
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
            data-testid={EventCardTestIds.DETAILS.ADDRESS}

          >
            <a
              href={getGoogleMapsUrl(location)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
              aria-label={`View ${name || 'event'} location on Google Maps`}
            >
              {location.address || location.venue || 'View on map'}
            </a>
          </DetailItem>
        )}

        {organiser && organiserDisplay && (
          <DetailItem
            icon={<UserCircleIcon />}
            ariaLabel={`Organised by: ${organiserDisplay}`}
            data-testid={EventCardTestIds.DETAILS.ORGANISER}
          >
            <a
              href={ensureExternalUrlScheme(organiser.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
              aria-label={`Visit organiser website for ${name || 'this event'}`}
            >
              Organised by: {organiserDisplay}
            </a>
          </DetailItem>
        )}

        {pricingDisplay && (
          <DetailItem
            icon={<CurrencyDollarIcon />}
            ariaLabel={`Event pricing: ${pricingDisplay}`}
            data-testid={EventCardTestIds.DETAILS.PRICING}
          >
            {pricingDisplay}
          </DetailItem>
        )}

        {socialMedia && (
          <div className="pt-1">
            <SocialMediaLinks
              socialMedia={socialMedia}
              data-testid={EventCardTestIds.DETAILS.SOCIAL_MEDIA}
            />
          </div>
        )}
      </section>
    )
  }
)
