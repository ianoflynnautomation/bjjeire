import { BjjEventDto } from '../types/event';

export const getGoogleMapsUrl = (event: BjjEventDto): string => {
  if (event.coordinates?.latitude && event.coordinates?.longitude) {
    return `https://www.google.com/maps?q=${event.coordinates.latitude},${event.coordinates.longitude}`;
  }
  if (event.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`;
  }
  return '#';
};