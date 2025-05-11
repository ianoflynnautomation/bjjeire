import React from 'react';
import { SiInstagram, SiFacebook, SiX, SiYoutube } from 'react-icons/si';
import { BjjEventDto } from '../../types/event';

type SocialMediaLinks = BjjEventDto['contact'] extends { socialMedia?: infer SM }
  ? SM
  : Record<string, string> | undefined;

interface EventSocialMediaProps {
  socialMedia?: SocialMediaLinks;
}

const platformConfig = {
  instagram: {
    IconComponent: SiInstagram,
    hoverTextColorClass: 'hover:text-[#E1306C]',
    label: 'Instagram',
  },
  facebook: {
    IconComponent: SiFacebook,
    hoverTextColorClass: 'hover:text-[#1877F2]',
    label: 'Facebook',
  },
  twitter: {
    IconComponent: SiX,
    hoverTextColorClass: 'hover:text-black',
    label: 'X (formerly Twitter)',
  },
  youtube: {
    IconComponent: SiYoutube,
    hoverTextColorClass: 'hover:text-[#FF0000]',
    label: 'YouTube',
  },
};

type KnownPlatform = keyof typeof platformConfig;

export const EventSocialMedia: React.FC<EventSocialMediaProps> = ({ socialMedia }) => {
  if (!socialMedia || Object.keys(socialMedia).length === 0) {
    return null;
  }

  const validSocialLinks = Object.entries(socialMedia)
    .filter((entry) => {
      const url = entry[1]; // entry[0] is the platform key, entry[1] is the URL
      return url && typeof url === 'string' && url.trim() !== '';
    })
    .map(([platform, url]) => ({
      platform: platform as KnownPlatform,
      url: url as string,
    }));

  if (validSocialLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {validSocialLinks.map(({ platform, url }) => {
        const config = platformConfig[platform];

        if (!config) {
          return null;
        }

        const { IconComponent, label } = config;

        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View on ${label}`}
            title={`View on ${label}`}
            className="
              group rounded-full p-1.5 transition-all duration-200 ease-in-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
              focus-visible:ring-indigo-500 focus-visible:ring-offset-white
              dark:focus-visible:ring-offset-slate-900
            "
          >
            <IconComponent
              className="
                h-5 w-5 text-slate-500 group-hover:scale-110 dark:text-slate-400
                ${hoverTextColorClass}
                transition-all duration-200 ease-in-out
              "
            />
          </a>
        );
      })}
    </div>
  );
};