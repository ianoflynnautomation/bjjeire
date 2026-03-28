import type { MapLocationData } from '@/types/common'

export function getGoogleMapsUrl(location?: MapLocationData | null): string {
  if (!location) {
    return '#'
  }

  const { coordinates, address, venue } = location
  const baseUrl = 'https://www.google.com/maps'

  if (
    coordinates &&
    typeof coordinates.latitude === 'number' &&
    typeof coordinates.longitude === 'number'
  ) {
    return `${baseUrl}/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`
  }

  const queryParts: string[] = []
  if (address?.trim()) {
    queryParts.push(address.trim())
  }
  if (
    venue?.trim() &&
    venue.trim().toLowerCase() !== address?.trim().toLowerCase()
  ) {
    queryParts.push(venue.trim())
  }

  if (queryParts.length > 0) {
    const query = queryParts.join(', ')
    return `${baseUrl}/search/?api=1&query=${encodeURIComponent(query)}`
  }

  return '#'
}
