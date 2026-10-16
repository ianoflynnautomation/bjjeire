import type { JSX } from 'react'
import {
  MapPinIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/20/solid'
import type { GymDto } from '@/types/gyms'
import { ensureExternalUrlScheme } from '@/utils/formatting-utils'
import { DetailItem } from '@/components/ui/icons/detail-item'
import { SocialMediaLinks } from '@/components/ui/social-media/social-media-links'
import { GymOfferedClasses, GymTrialOffer } from '.'
import { getGoogleMapsUrl } from '@/utils/map-utils'
import { GymCardTestIds } from '@/constants/gymDataTestIds'
import { DetailItemTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'
import { readField, readString } from '@/utils/untrusted'

const gymCard = uiContent.gyms.card

interface GymDetailsProps {
  gym: GymDto
  'data-testid'?: string
}

export const GymDetails = function GymDetails({
  gym,
  'data-testid': rootDataTestId,
}: GymDetailsProps): JSX.Element {
  const { location, timetableUrl, socialMedia, offeredClasses, trialOffer } =
    gym

  const headingId = `gym-details-heading-${gym.id ?? readString(gym.name).replaceAll(/\s+/gu, '-')}`
  const address = readString(readField(location, 'address'))
  const venue = readString(readField(location, 'venue'))
  const mapsUrl = getGoogleMapsUrl(location)
  const place = [address, venue].filter(Boolean).join(', ')

  return (
    <section
      className="space-y-2 text-sm"
      aria-labelledby={headingId}
      data-testid={rootDataTestId ?? DetailItemTestIds.ROOT}
    >
      <h4 id={headingId} className="sr-only">
        {gymCard.detailsSrLabel} {gym.name || gymCard.fallbackRef}
      </h4>

      {address && (
        <DetailItem
          icon={<MapPinIcon />}
          ariaLabel={`${gymCard.locationAriaPrefix} ${place}`}
          data-testid={GymCardTestIds.ADDRESS}
        >
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm text-fg-muted underline-offset-2 transition-colors hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus dark:text-ink-300 dark:hover:text-primary-300"
              data-testid={GymCardTestIds.ADDRESS_LINK}
            >
              {address} {venue && `(${venue})`}
            </a>
          ) : (
            <span data-testid={GymCardTestIds.ADDRESS_LINK}>
              {address} {venue && `(${venue})`}
            </span>
          )}
        </DetailItem>
      )}

      {timetableUrl && (
        <DetailItem
          icon={<ClipboardDocumentListIcon />}
          ariaLabel={gymCard.viewTimetableLink}
          data-testid={GymCardTestIds.TIMETABLE}
        >
          <a
            href={ensureExternalUrlScheme(timetableUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm text-fg-muted underline-offset-2 transition-colors hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus dark:text-ink-300 dark:hover:text-primary-300"
            data-testid={GymCardTestIds.TIMETABLE_LINK}
          >
            {gymCard.viewTimetableLink}
          </a>
        </DetailItem>
      )}

      <GymOfferedClasses
        classes={offeredClasses}
        data-testid={GymCardTestIds.CLASSES}
      />
      <GymTrialOffer
        trialOffer={trialOffer}
        data-testid={GymCardTestIds.TRIAL_OFFER}
      />

      <div className="pt-1">
        <SocialMediaLinks
          socialMedia={socialMedia}
          data-testid={GymCardTestIds.SOCIAL_MEDIA}
        />
      </div>
    </section>
  )
}
