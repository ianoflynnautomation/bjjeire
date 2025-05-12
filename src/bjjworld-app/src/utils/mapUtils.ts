import { BjjEventDto } from '../types/event';

export const getGoogleMapsUrl = (event: BjjEventDto): string => {
  if (!event.location) {
    return '#';
  }

  const { coordinates, address, venue } = event.location;

  if (coordinates?.latitude && coordinates?.longitude) {
    return `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
  }

  if (address || venue) {
    // Combine address and venue for a more precise search, if both are available
    const query = [address, venue].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return '#';
};