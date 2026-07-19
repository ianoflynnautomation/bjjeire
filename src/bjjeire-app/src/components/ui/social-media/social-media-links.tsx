import { memo } from 'react'
import type { JSX } from 'react'
import { isKnownPlatform } from './social-media.config'
import type { KnownPlatform } from './social-media.config'
import { SocialLink } from './social-link'
import type { SocialMediaDto } from '@/types/common'
import { SocialMediaLinksTestIds } from '@/constants/commonDataTestIds'

interface SocialMediaLinksProps {
  socialMedia?: SocialMediaDto
  'data-testid'?: string
}

export const SocialMediaLinks = memo(function SocialMediaLinks({
  socialMedia,
  'data-testid': dataTestIdFromProp,
}: SocialMediaLinksProps): JSX.Element | null {
  if (!socialMedia) {
    return null
  }

  const validSocialLinks = Object.entries(socialMedia)
    .filter(
      ([platform, url]) =>
        isKnownPlatform(platform) &&
        url &&
        typeof url === 'string' &&
        url.trim() !== ''
    )
    .map(([platform, url]) => ({
      platform: platform as KnownPlatform,
      url: url as string,
    }))

  if (validSocialLinks.length === 0) {
    return null
  }

  const rootTestId = dataTestIdFromProp ?? SocialMediaLinksTestIds.ROOT

  return (
    <div
      className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1"
      data-testid={rootTestId}
    >
      {validSocialLinks.map(({ platform, url }) => (
        <SocialLink
          key={platform}
          platform={platform}
          url={url}
          data-testid={SocialMediaLinksTestIds.LINK}
        />
      ))}
    </div>
  )
})
