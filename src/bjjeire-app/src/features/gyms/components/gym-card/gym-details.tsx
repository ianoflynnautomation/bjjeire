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

interface GymDetailsProps {
  gym: GymDto
  'data-testid'?: string
  testIdInstanceSuffix?: string
}

export const GymDetails: React.FC<GymDetailsProps> = memo(
  ({
    gym,
    'data-testid': rootDataTestId,
    testIdInstanceSuffix = gym.id ||
      gym.name.replace(/\s+/g, '-').toLowerCase(),
  }) => {
    const {
      location,
      affiliation,
      timetableUrl,
      socialMedia,
      offeredClasses,
      trialOffer,
    } = gym

    const actualRootDataTestId =
      rootDataTestId || GymCardTestIds.DETAILS.ROOT(testIdInstanceSuffix)

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
            data-testid={GymCardTestIds.DETAILS.ADDRESS(testIdInstanceSuffix)}
            testIdInstanceSuffix={testIdInstanceSuffix}
          >
            <a
              href={getGoogleMapsUrl(gym.location)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
            >
              {location.address} {location.venue && `(${location.venue})`}
            </a>
          </DetailItem>
        )}

        {affiliation?.name && (
          <DetailItem
            icon={<BuildingLibraryIcon />}
            ariaLabel={`Affiliation: ${affiliation.name}`}
            data-testid={GymCardTestIds.DETAILS.AFFILIATION(
              testIdInstanceSuffix
            )}
            testIdInstanceSuffix={testIdInstanceSuffix}
          >
            {affiliation.website ? (
              <a
                href={ensureExternalUrlScheme(affiliation.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
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
            data-testid={GymCardTestIds.DETAILS.TIMETABLE(testIdInstanceSuffix)}
            testIdInstanceSuffix={testIdInstanceSuffix}
          >
            <a
              href={ensureExternalUrlScheme(timetableUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
            >
              View Timetable
            </a>
          </DetailItem>
        )}

        <GymOfferedClasses
          classes={offeredClasses}
          data-testid={GymCardTestIds.DETAILS.CLASSES(testIdInstanceSuffix)}
          testIdInstanceSuffix={testIdInstanceSuffix}
        />
        <GymTrialOffer
          trialOffer={trialOffer}
          data-testid={GymCardTestIds.DETAILS.TRIAL(testIdInstanceSuffix)}
          testIdInstanceSuffix={testIdInstanceSuffix}
        />

        {socialMedia && (
          <div className="pt-1">
            <SocialMediaLinks
              socialMedia={socialMedia}
              data-testid={GymCardTestIds.DETAILS.SOCIAL_MEDIA(
                testIdInstanceSuffix
              )}
              testIdInstanceSuffix={testIdInstanceSuffix}
            />
          </div>
        )}
      </section>
    )
  }
)
