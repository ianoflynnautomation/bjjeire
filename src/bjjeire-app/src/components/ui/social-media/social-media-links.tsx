import React from 'react'
import {
  platformConfig,
  KnownPlatform,
  isKnownPlatform,
} from './social-media.config'
import { SocialMediaDto } from '@/types/common'
import { SocialMediaLinksTestIds } from '@/constants/commonDataTestIds'

interface SocialLinkProps {
  platform: KnownPlatform
  url: string
  'data-testid'?: string 
}

const SocialLink: React.FC<SocialLinkProps> = ({
  platform,
  url,
  'data-testid': rootDataTestId,
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
      data-testid={rootDataTestId}
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
      />
    </a>
  )
}

interface SocialMediaLinksProps {
  socialMedia?: SocialMediaDto
  'data-testid'?: string
  
}

export const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  socialMedia,
  'data-testid': rootDataTestIdFromParent,
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

  const actualRootDataTestId =
    rootDataTestIdFromParent ||
    SocialMediaLinksTestIds.ROOT

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
          data-testid={SocialMediaLinksTestIds.LINK}
        />
      ))}
    </div>
  )
}
