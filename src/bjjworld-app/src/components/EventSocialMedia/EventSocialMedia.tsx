// src/components/EventSocialMedia/EventSocialMedia.tsx
import React from 'react'
import { platformConfig, KnownPlatform, isKnownPlatform } from './socialMedia.config'

interface SocialLinkItemProps {
  platform: KnownPlatform
  url: string
}

const SocialLink: React.FC<SocialLinkItemProps> = ({ platform, url }) => {
  const config = platformConfig[platform]
  if (!config) {
    console.warn(`No configuration found for social media platform: ${platform}`)
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
      className={`
        group rounded-full p-1.5 transition-all duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        focus-visible:ring-indigo-500 focus-visible:ring-offset-white
        dark:focus-visible:ring-offset-slate-900
      `}
    >
      <IconComponent
        className={`
          h-5 w-5 text-slate-500 group-hover:scale-110 dark:text-slate-400
          ${hoverTextColorClass}
          transition-all duration-200 ease-in-out
        `}
      />
    </a>
  )
}
// --- End of SocialLink sub-component ---

interface EventSocialMediaProps {
  socialMedia?: Record<string, string>
}

export const EventSocialMedia: React.FC<EventSocialMediaProps> = ({ socialMedia }) => {
  if (!socialMedia || Object.keys(socialMedia).length === 0) {
    return null
  }

  const validSocialLinks = Object.entries(socialMedia)
    .filter(([platform, url]) => {
      return isKnownPlatform(platform) && url && typeof url === 'string' && url.trim() !== ''
    })
    .map(([platform, url]) => ({
      platform: platform as KnownPlatform,
      url: url as string,
    }))

  if (validSocialLinks.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {validSocialLinks.map(({ platform, url }) => (
        <SocialLink key={platform} platform={platform} url={url} />
      ))}
    </div>
  )
}
