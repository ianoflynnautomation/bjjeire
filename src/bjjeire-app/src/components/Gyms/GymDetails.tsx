import React, { memo } from 'react';
import {
  MapPinIcon,
  BuildingLibraryIcon, // For affiliation
  // GlobeAltIcon,      // For website
  ClipboardDocumentListIcon, // For timetable
//   InformationCircleIcon, // For description
} from '@heroicons/react/20/solid';
import { GymDto } from '../../types/gyms';
import { formatDisplayUrl, ensureExternalUrlScheme } from '../../utils/formattingUtils';
import { DetailItem } from '../common/DetailItem';
import { SocialMediaLinks } from '../common/SocialLinks/SocialLinks';
import { GymOfferedClasses } from './GymOfferedClasses';
import { GymTrialOffer } from './GymTrialOffer';
import { getGoogleMapsUrl } from '../../utils/mapUtils'; // Adjust path
// ...

interface GymDetailsProps {
  gym: GymDto;
  'data-testid'?: string;
}

export const GymDetails: React.FC<GymDetailsProps> = memo(
  ({ gym, 'data-testid': baseTestId = 'gym-details' }) => {
    const {
      location,
      affiliation,
      // website,
      timetableUrl,
      socialMedia,
      // description,
      offeredClasses,
      trialOffer,
    } = gym;

    return (
      <section
        className="space-y-2.5 text-sm" // Adjusted spacing
        aria-labelledby={`gym-details-heading-${gym.id || gym.name}`}
        data-testid={baseTestId}
      >
        <h2 id={`gym-details-heading-${gym.id || gym.name}`} className="sr-only">
          Details for {gym.name || 'this gym'}
        </h2>

        {/* {description && (
            <DetailItem
                icon={<InformationCircleIcon />}
                ariaLabel={`Description: ${description.substring(0, 100)}...`}
                data-testid={`${baseTestId}-description`}
                className="text-slate-600 dark:text-slate-300"
            >
                <p>{description}</p>
            </DetailItem>
        )} */}

        {location?.address && (
          <DetailItem
            icon={<MapPinIcon />}
            ariaLabel={`Location: ${location.address}, ${location.venue}`}
            data-testid={`${baseTestId}-address`}
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
            data-testid={`${baseTestId}-affiliation`}
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

        {/* {website && (
          <DetailItem
            icon={<GlobeAltIcon />}
            ariaLabel={`Website: ${formatDisplayUrl(website)}`}
            data-testid={`${baseTestId}-website`}
          >
            <a
              href={ensureExternalUrlScheme(website)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
            >
              {formatDisplayUrl(website)}
            </a>
          </DetailItem>
        )} */}

        {timetableUrl && (
          <DetailItem
            icon={<ClipboardDocumentListIcon />}
            ariaLabel={`Timetable: ${formatDisplayUrl(timetableUrl)}`}
            data-testid={`${baseTestId}-timetable`}
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

        <GymOfferedClasses classes={offeredClasses} data-testid={`${baseTestId}-classes`} />
        <GymTrialOffer trialOffer={trialOffer} data-testid={`${baseTestId}-trial`} />

        {socialMedia && (
          <div className="pt-1"> {/* Adjusted padding */}
            <SocialMediaLinks socialMedia={socialMedia} data-testid={`${baseTestId}-social-media`} />
          </div>
        )}
      </section>
    );
  }
);