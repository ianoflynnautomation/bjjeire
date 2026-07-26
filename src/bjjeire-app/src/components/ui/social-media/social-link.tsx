import type { JSX } from 'react'
import type { KnownPlatform } from './social-media.config'
import { platformConfig } from './social-media.config'
import { cn } from '@/lib/cn'

interface SocialLinkProps {
  platform: KnownPlatform
  url: string
  'data-testid'?: string
}

export const SocialLink = function SocialLink({
  platform,
  url,
  'data-testid': dataTestId,
}: SocialLinkProps): JSX.Element | null {
  const { IconComponent, label, hoverTextColorClass } = platformConfig[platform]

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View on ${label}`}
      title={`View on ${label}`}
      data-testid={dataTestId}
      className={cn(
        'group rounded-full p-1.5 ring-1 ring-transparent transition-all duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'focus-visible:ring-primary-500 focus-visible:ring-offset-ink-900',
        'hover:ring-primary-500/30'
      )}
    >
      <IconComponent
        className={cn(
          'h-5 w-5 text-fg-subtle transition-all duration-200 ease-in-out group-hover:scale-110',
          hoverTextColorClass
        )}
        aria-hidden="true"
      />
    </a>
  )
}
