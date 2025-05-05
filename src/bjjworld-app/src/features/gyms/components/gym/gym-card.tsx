import { memo } from 'react'
// Added FaGlobe to imports
import { FaMapMarkerAlt, FaImage, FaClock, FaFacebook, FaInstagram, FaGlobe } from 'react-icons/fa'
import {
  ContactDto,
  GymLocationDto,
  GymOpeningHoursDto,
  GeoCoordinatesDto,
} from '../../../../types/gyms'

interface GymCardProps {
  name: string
  description: string
  openingHours: GymOpeningHoursDto[]
  address: GymLocationDto
  coordinates?: GeoCoordinatesDto
  contact: ContactDto
  imageUrl?: string
}

const InfoGymCard: React.FC<GymCardProps> = ({
  name,
  address,
  contact,
  openingHours,
  imageUrl,
}) => {
  const street = address?.address
  const city = address?.city
  const postalCode = address?.postalCode
  const facebookUrl = contact?.socialMedia?.facebook
  const instagramUrl = contact?.socialMedia?.instagram
  const websiteUrl = contact?.website // Get website URL

  let displayAddress = street
  if (city || postalCode) {
    if (displayAddress) displayAddress += ', '
    displayAddress += `${city || ''}${city && postalCode ? ' ' : ''}${postalCode || ''}`
  }

  const showContactLinks = facebookUrl || instagramUrl || websiteUrl
  const showHours = openingHours && openingHours.length > 0

  return (
    <article
      className={`
                group relative aspect-square w-full max-w-[280px] sm:max-w-[320px] // Control max size here
                bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg
                transition-shadow duration-300 ease-in-out
                flex flex-col // Arrange image and info vertically
            `}
      aria-labelledby={`gym-card-title-${name}`}
    >
      {/* Image Section (Top Half) */}
      <div className="relative w-full h-1/2 flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${name} facility view`}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-zinc-200 flex flex-col items-center justify-center text-zinc-400">
            <FaImage className="text-4xl mb-2" />
            <span className="text-xs text-center px-2">Image Unavailable</span>
          </div>
        )}
        {/* Optional: Subtle gradient overlay at the bottom of the image to transition to info */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
      </div>

      {/* Info Section (Bottom Half) */}
      <div className="p-3 sm:p-4 flex-grow flex flex-col justify-between overflow-y-auto space-y-2 text-sm">
        {' '}
        {/* Added overflow-y-auto and space-y */}
        {/* Top part of Info: Name & Address */}
        <div>
          <h2
            id={`gym-card-title-${name}`}
            className="text-base sm:text-lg font-semibold text-zinc-800 leading-tight truncate mb-1" // Added truncate
            title={name} // Show full name on hover if truncated
          >
            {name}
          </h2>
          {displayAddress && (
            <div className="flex items-start text-xs sm:text-sm text-zinc-600">
              <FaMapMarkerAlt
                className="mr-1.5 mt-0.5 flex-shrink-0 text-zinc-400"
                aria-hidden="true"
              />
              <span className="line-clamp-2">{displayAddress}</span>{' '}
              {/* Limit address to 2 lines */}
            </div>
          )}
        </div>
        {/* Middle Part: Opening Hours */}
        {showHours && (
          <div className="text-xs border-t border-zinc-100 pt-1.5">
            <h3 className="font-medium text-zinc-500 mb-1 flex items-center gap-1.5">
              <FaClock aria-hidden="true" /> Hours
            </h3>
            <div className="space-y-0.5 max-h-[60px] overflow-y-auto pr-1">
              {' '}
              {/* Limit height and allow scroll within hours */}
              {openingHours.map((day) => (
                <div key={day.day} className="flex justify-between text-zinc-600">
                  <span className="font-medium w-1/3 truncate">{day.day}</span>
                  <span className="text-right w-2/3">
                    {day.openTime} - {day.closeTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Bottom part of Info: Contact Links (Social + Website) */}
        {/* Updated conditional variable name */}
        {showContactLinks && (
          // Added justify-end to push icons to the right if desired, or keep justify-start
          <div className="flex items-center justify-start gap-4 pt-1.5 border-t border-zinc-100">
            {' '}
            {/* Increased gap slightly */}
            {/* Website Link */}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-blue-600 transition-colors" // Consistent hover with Facebook
                aria-label={`Visit ${name} website`}
              >
                <FaGlobe className="text-lg" />
              </a>
            )}
            {/* Facebook Link */}
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-blue-600 transition-colors"
                aria-label={`${name} on Facebook`}
              >
                <FaFacebook className="text-lg" />
              </a>
            )}
            {/* Instagram Link */}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-pink-600 transition-colors"
                aria-label={`${name} on Instagram`}
              >
                <FaInstagram className="text-lg" />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default memo(InfoGymCard)
