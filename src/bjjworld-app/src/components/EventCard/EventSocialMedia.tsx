import React from 'react';
import { SiInstagram, SiFacebook, SiX, SiYoutube } from 'react-icons/si';
import { BjjEventDto } from '../../types/event';

interface EventSocialMediaProps {
  socialMedia: BjjEventDto['contact']['socialMedia'];
}

export const EventSocialMedia: React.FC<EventSocialMediaProps> = ({ socialMedia }) => {
  if (!socialMedia) return null;

  const socialMediaIcons: { [key: string]: React.ReactElement } = {
    instagram: (
      <SiInstagram
        className="h-5 w-5 text-gray-600 hover:text-[#E1306C] hover:scale-110"
        aria-label="Instagram"
      />
    ),
    facebook: (
      <SiFacebook
        className="h-5 w-5 text-gray-600 hover:text-[#1877F2] hover:scale-110"
        aria-label="Facebook"
      />
    ),
    twitter: (
      <SiX
        className="h-5 w-5 text-gray-600 hover:text-black hover:scale-110"
        aria-label="X"
      />
    ),
    youtube: (
      <SiYoutube
        className="h-5 w-5 text-gray-600 hover:text-[#FF0000] hover:scale-110"
        aria-label="YouTube"
      />
    ),
  };

  return (
    <div className="mt-2 flex justify-center gap-4">
      {Object.entries(socialMedia).map(([platform, url]) => {
        const icon = socialMediaIcons[platform.toLowerCase()];
        return (
          icon &&
          url && (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${platform} link`}
            >
              {icon}
            </a>
          )
        );
      })}
    </div>
  );
};