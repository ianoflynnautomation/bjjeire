import React from 'react';
import { platformConfig, KnownPlatform, isKnownPlatform } from './socialMedia.config'; // Assuming config is in the same folder
import { SocialMediaDto } from '../../../types/common'; // Or a common DTO path

interface SocialLinkProps {
  platform: KnownPlatform;
  url: string;
  'data-testid'?: string;
}

const SocialLink: React.FC<SocialLinkProps> = ({ platform, url, 'data-testid': dataTestId }) => {
  const config = platformConfig[platform];
  if (!config) {
    // console.warn(`No configuration found for social media platform: ${platform}`); // Keep if useful
    return null;
  }
  const { IconComponent, label, hoverTextColorClass } = config;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View on ${label}`}
      title={`View on ${label}`}
      data-testid={dataTestId}
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
  );
};

interface SocialMediaLinksProps {
  socialMedia?: SocialMediaDto; // Make socialMedia prop optional
  'data-testid'?: string;
}

export const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  socialMedia,
  'data-testid': baseTestId = 'social-media-links',
}) => {
  if (!socialMedia) {
    return null;
  }

  const validSocialLinks = Object.entries(socialMedia)
    .filter(([platform, url]) => {
      return isKnownPlatform(platform) && url && typeof url === 'string' && url.trim() !== '';
    })
    .map(([platform, url]) => ({
      platform: platform as KnownPlatform,
      url: url as string,
    }));

  if (validSocialLinks.length === 0) {
    return null;
  }

  return (
    <div
      className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1" // Adjusted gap
      data-testid={baseTestId}
    >
      {validSocialLinks.map(({ platform, url }) => (
        <SocialLink
          key={platform}
          platform={platform}
          url={url}
          data-testid={`<span class="math-inline">{baseTestId}-link-</span>{platform.toLowerCase()}`}
        />
      ))}
    </div>
  );
};