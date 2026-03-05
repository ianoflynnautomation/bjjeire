import { memo } from 'react'
import { MapPinIcon } from '@heroicons/react/20/solid'
import type { GymDto } from '@/types/gyms'
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
    socialMedia,
    offeredClasses,
    trialOffer,
  } = gym

  const headingId = `gym-details-heading-${gym.id ?? gym.name.replace(/\s+/g, '-')}`

    return (
      <section
        className="space-y-2 text-sm"
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
            className="rounded-sm text-slate-300 underline-offset-2 transition-colors hover:text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
            data-testid={GymCardTestIds.ADDRESS_LINK}
          >
            {location.address} {location.venue && `(${location.venue})`}
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
