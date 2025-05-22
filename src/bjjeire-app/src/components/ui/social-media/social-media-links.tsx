import React from 'react'
import {
  platformConfig,
  KnownPlatform,
  isKnownPlatform,
} from './social-media.config'
import { SocialMediaDto } from '../../../types/common'
import { SocialMediaLinksTestIds } from '../../../constants/commonDataTestIds'

interface SocialLinkProps {
  platform: KnownPlatform
  url: string
  'data-testid'?: string // For the root <a> tag, constructed by SocialMediaLinks
  testIdInstanceSuffix?: string // Passed from SocialMediaLinks for the icon
}

const SocialLink: React.FC<SocialLinkProps> = ({
  platform,
  url,
  'data-testid': rootDataTestId, // This is the data-testid for the <a> tag itself
  testIdInstanceSuffix = '', // Default if not provided
}) => {
  const config = platformConfig[platform]
  if (!config) {
    return null
  }
  const { IconComponent, label, hoverTextColorClass } = config

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View on ${label}`}
      title={`View on ${label}`}
      data-testid={rootDataTestId} // Use the fully formed data-testid from parent
      className={`
        group rounded-full p-1.5 transition-all duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        focus-visible:ring-emerald-500 focus-visible:ring-offset-white
        dark:focus-visible:ring-offset-slate-900
      `}
    >
      <IconComponent
        className={`
          h-5 w-5 text-slate-500 group-hover:scale-110 dark:text-slate-400
          ${hoverTextColorClass}
          transition-all duration-200 ease-in-out
        `}
        aria-hidden="true"
        // Use the explicit testIdInstanceSuffix for the icon
        // Assumes SocialMediaLinksTestIds.ICON takes (platform, suffix_id)
        data-testid={SocialMediaLinksTestIds.ICON(
          platform.toLowerCase(),
          testIdInstanceSuffix
        )}
      />
    </a>
  )
}

interface SocialMediaLinksProps {
  socialMedia?: SocialMediaDto
  'data-testid'?: string // For the root of SocialMediaLinks, set by its parent
  testIdInstanceSuffix?: string // Passed from its parent for all internal elements
}

export const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  socialMedia,
  'data-testid': rootDataTestIdFromParent, // data-testid for the root of this component
  testIdInstanceSuffix = '', // Instance suffix passed from this component's parent
}) => {
  if (!socialMedia) {
    return null
  }

  const validSocialLinks = Object.entries(socialMedia)
    .filter(([platform, url]) => {
      return (
        isKnownPlatform(platform) &&
        url &&
        typeof url === 'string' &&
        url.trim() !== ''
      )
    })
    .map(([platform, url]) => ({
      platform: platform as KnownPlatform,
      url: url as string,
    }))

  if (validSocialLinks.length === 0) {
    return null
  }

  // Determine the root test ID for SocialMediaLinks itself
  // It uses the passed data-testid or generates one using the instance suffix
  const actualRootDataTestId =
    rootDataTestIdFromParent ||
    SocialMediaLinksTestIds.ROOT(testIdInstanceSuffix)

  return (
    <div
      className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1"
      data-testid={actualRootDataTestId}
    >
      {validSocialLinks.map(({ platform, url }) => (
        <SocialLink
          key={platform}
          platform={platform}
          url={url}
          // data-testid for the SocialLink's root <a> tag, incorporating platform and instance suffix
          // Assumes SocialMediaLinksTestIds.LINK takes (platform, suffix_id)
          data-testid={SocialMediaLinksTestIds.LINK(
            platform.toLowerCase(),
            testIdInstanceSuffix
          )}
          // Pass the instance suffix to SocialLink for its internal elements (icon)
          testIdInstanceSuffix={testIdInstanceSuffix}
        />
      ))}
    </div>
  )
}
