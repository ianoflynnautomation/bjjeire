import { SiInstagram, SiFacebook, SiX, SiYoutube } from 'react-icons/si';

export const platformConfig = {
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
  x: {
    IconComponent: SiX,
    hoverTextColorClass: 'hover:text-black dark:hover:text-white',
    label: 'X',
  },
  youTube: {
    IconComponent: SiYoutube,
    hoverTextColorClass: 'hover:text-[#FF0000]',
    label: 'YouTube',
  },
} as const;

export type KnownPlatform = keyof typeof platformConfig;

export function isKnownPlatform(platform: string): platform is KnownPlatform {
  return platform in platformConfig;
}