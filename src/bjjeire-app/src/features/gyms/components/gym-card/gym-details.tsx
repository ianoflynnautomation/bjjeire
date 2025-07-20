import React, { memo } from 'react'
import {
  MapPinIcon,
  BuildingLibraryIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/20/solid'
import { GymDto } from '../../../../types/gyms'
import {
  formatDisplayUrl,
  ensureExternalUrlScheme,
} from '../../../../utils/formattingUtils'
import { DetailItem } from '../../../../components/ui/icons/detail-item'
import { SocialMediaLinks } from '../../../../components/ui/social-media/social-media-links'
import { GymOfferedClasses, GymTrialOffer } from '.'
import { getGoogleMapsUrl } from '../../../../utils/mapUtils'
import { GymCardTestIds } from '../../../../constants/gymDataTestIds'
import {DetailItemTestIds} from '../../../../constants/commonDataTestIds'

interface GymDetailsProps {
  gym: GymDto
  'data-testid'?: string
}

export const GymDetails: React.FC<GymDetailsProps> = memo(
  ({ gym, 'data-testid': rootDataTestId }) => {
    const {
      location,
      affiliation,
      timetableUrl,
      socialMedia,
      offeredClasses,
      trialOffer,
    } = gym

    const actualRootDataTestId = rootDataTestId || DetailItemTestIds.ROOT

    return (
      <section
        className="space-y-2.5 text-sm"
        aria-labelledby={`gym-details-heading-${gym.id || gym.name}`}
        data-testid={actualRootDataTestId}
      >
        <h2
          id={`gym-details-heading-${gym.id || gym.name}`}
          className="sr-only"
        >
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
              className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
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
                className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
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
              className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
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
  }
)
