import { MapLocationData } from '@/types/common';

// You can place this in a shared utils file, e.g., src/utils/mapUtils.ts

/**
 * Generates a Google Maps URL based on provided location data.
 * Prioritizes coordinates if available, otherwise falls back to address/venue query.
 *
 * @param location - The location data object.
 * @returns A string containing the Google Maps URL, or '#' if no usable data is found.
 */
export const getGoogleMapsUrl = (location?: MapLocationData | null): string => {
  if (!location) {
    return '#'; // Return a non-functional link or handle as preferred
  }

  const { coordinates, address, venue } = location;

  // Priority 1: Use latitude and longitude if valid
  if (
    coordinates &&
    typeof coordinates.latitude === 'number' &&
    typeof coordinates.longitude === 'number'
  ) {
    // URL to open map centered at lat/long, placing a marker.
    return `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
    // Alternative: For a search that might resolve to a place name at those coords:
    // return `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
  }

  // Priority 2: Use address and/or venue for a search query
  const queryParts: string[] = [];
  if (address && address.trim()) {
    queryParts.push(address.trim());
  }
  if (venue && venue.trim() && venue.trim() !== address?.trim()) { // Avoid duplicating venue if it's same as address
    queryParts.push(venue.trim());
  }

  if (queryParts.length > 0) {
    const query = queryParts.join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  // Fallback if no usable information
  return '#';
};