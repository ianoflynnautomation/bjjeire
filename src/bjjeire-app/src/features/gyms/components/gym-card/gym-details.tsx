import { memo } from 'react'
import {
  MapPinIcon,
  BuildingLibraryIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/20/solid'
import type { GymDto } from '@/types/gyms'
import {
  formatDisplayUrl,
  ensureExternalUrlScheme,
} from '@/utils/formattingUtils'
import { DetailItem } from '@/components/ui/icons/detail-item'
import { SocialMediaLinks } from '@/components/ui/social-media/social-media-links'
import { GymOfferedClasses, GymTrialOffer } from '.'
import { getGoogleMapsUrl } from '@/utils/mapUtils'
import { GymCardTestIds } from '@/constants/gymDataTestIds'
import { DetailItemTestIds } from '@/constants/commonDataTestIds'

interface GymDetailsProps {
  gym: GymDto
  'data-testid'?: string
}

export const GymDetails = memo(function GymDetails({
  gym,
  'data-testid': rootDataTestId,
}: GymDetailsProps) {
  const {
    location,
    affiliation,
    timetableUrl,
    socialMedia,
    offeredClasses,
    trialOffer,
  } = gym

  const headingId = `gym-details-heading-${gym.id ?? gym.name.replace(/\s+/g, '-')}`

  return (
    <section
      className="space-y-2.5 text-sm"
      aria-labelledby={headingId}
      data-testid={rootDataTestId || DetailItemTestIds.ROOT}
    >
      <h2 id={headingId} className="sr-only">
        Details for {gym.name || 'this gym'}
      </h2>

      {location?.address && (
        <DetailItem
          icon={<MapPinIcon />}
          ariaLabel={`Location: ${location.address}, ${location.venue || ''}`}
          data-testid={GymCardTestIds.ADDRESS}
        >
          <a
            href={getGoogleMapsUrl(gym.location)}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
            data-testid={GymCardTestIds.ADDRESS_LINK}
          >
            {location.address} {location.venue && `(${location.venue})`}
          </a>
        </DetailItem>
      )}

      {affiliation?.name && (
        <DetailItem
          icon={<BuildingLibraryIcon />}
          ariaLabel={`Affiliation: ${affiliation.name}`}
          data-testid={GymCardTestIds.AFFILIATION}
        >
          {affiliation.website ? (
            <a
              href={ensureExternalUrlScheme(affiliation.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
              data-testid={GymCardTestIds.AFFILIATION_LINK}
            >
              Affiliated with {affiliation.name}
            </a>
          ) : (
            `Affiliated with ${affiliation.name}`
          )}
        </DetailItem>
      )}

      {timetableUrl && (
        <DetailItem
          icon={<ClipboardDocumentListIcon />}
          ariaLabel={`Timetable: ${formatDisplayUrl(timetableUrl)}`}
          data-testid={GymCardTestIds.TIMETABLE}
        >
          <a
            href={ensureExternalUrlScheme(timetableUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
            data-testid={GymCardTestIds.TIMETABLE_LINK}
          >
            View Timetable
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

      {socialMedia && (
        <div className="pt-1">
          <SocialMediaLinks
            socialMedia={socialMedia}
            data-testid={GymCardTestIds.SOCIAL_MEDIA}
          />
        </div>
      )}
    </section>
  )
})
