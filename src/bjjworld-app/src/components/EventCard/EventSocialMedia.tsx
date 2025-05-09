import React from 'react';
import { SiInstagram, SiFacebook, SiX, SiYoutube } from 'react-icons/si';

import { BjjEventDto } from '../../types/event';

interface EventSocialMediaProps {
  socialMedia: BjjEventDto['contact']['socialMedia'];
}

export const EventSocialMedia: React.FC<EventSocialMediaProps> = ({ socialMedia }) => {
  if (!socialMedia) return null;

  // Define social media icons using react-icons
  const socialMediaIcons: { [key: string]: React.ReactElement } = {
    instagram: (
      <SiInstagram // Using Simple Icons
        className="h-5 w-5 text-gray-600 hover:text-[#E1306C] transition-transform duration-200 ease-in-out hover:scale-125"
        aria-label="Instagram"
      />
    ),
    facebook: (
      <SiFacebook // Using Simple Icons
        className="h-5 w-5 text-gray-600 hover:text-[#1877F2] transition-transform duration-200 ease-in-out hover:scale-125"
        aria-label="Facebook"
      />
    ),
    twitter: ( // Note: X.com is often represented by SiX or FaTwitter
      <SiX // Using Simple Icons (for X)
        className="h-5 w-5 text-gray-600 hover:text-[#000000] transition-transform duration-200 ease-in-out hover:scale-125" // X's color is often black or white
        aria-label="X (formerly Twitter)"
      />
      // Or for the bird logo if preferred, and if the platform name is "twitter"
      // <FaTwitter
      //   className="h-5 w-5 text-gray-600 hover:text-[#1DA1F2] transition-transform duration-200 ease-in-out hover:scale-125"
      //   aria-label="Twitter"
      // />
    ),
    youtube: (
      <SiYoutube // Using Simple Icons
        className="h-5 w-5 text-gray-600 hover:text-[#FF0000] transition-transform duration-200 ease-in-out hover:scale-125"
        aria-label="YouTube"
      />
    ),
  };

  return (
    <div className="flex space-x-4 mt-2 justify-center">
      {Object.entries(socialMedia).map(([platform, url]) => {
        const platformKey = platform.toLowerCase();
        // Handle common variations like "x" or "twitter"
        const iconKey = platformKey === 'x' ? 'twitter' : platformKey; // Or adjust based on your `socialMedia` keys
        const iconElement = socialMediaIcons[iconKey];

        return (
          iconElement && url && (
            <a
              key={platform}
              href={url as string} // Assuming url is always a string
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${platform} link`}
            >
              {iconElement}
            </a>
          )
        );
      })}
    </div>
  );
};