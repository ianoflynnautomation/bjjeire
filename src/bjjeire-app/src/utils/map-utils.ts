import type { MapLocationData } from '@/types/common'

export function getGoogleMapsUrl(location?: MapLocationData | null): string {
  if (!location) {
    return '#'
  }

  const { coordinates, address, venue } = location
  const baseUrl = 'https://www.google.com/maps'

  if (
    coordinates?.coordinates &&
    typeof coordinates.coordinates[0] === 'number' &&
    typeof coordinates.coordinates[1] === 'number'
  ) {
    // Google Maps expects lat,lng — GeoJSON stores [lng, lat]
    return `${baseUrl}/search/?api=1&query=${coordinates.coordinates[1]},${coordinates.coordinates[0]}`
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
