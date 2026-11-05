import type { GymDto } from '@/types/gyms'
import { readField, readString } from '@/utils/untrusted'

export interface GymPin {
  key: string
  gym: GymDto
  latitude: number
  longitude: number
}

interface GymPinsResult {
  pins: GymPin[]
  unmappedCount: number
}

function isCoordinate(value: unknown, limit: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Math.abs(value) <= limit
  )
}

/** Reads GeoJSON `[longitude, latitude]`. Returns undefined when a pin could not be placed truthfully. */
function readLatLng(
  gym: GymDto
): { latitude: number; longitude: number } | undefined {
  const point = readField(readField(gym, 'location'), 'coordinates')
  const pair = readField(point, 'coordinates')
  if (!Array.isArray(pair) || pair.length !== 2) {
    return undefined
  }
  const [longitude, latitude] = pair as unknown[]
  if (!isCoordinate(longitude, 180) || !isCoordinate(latitude, 90)) {
    return undefined
  }
  // 0,0 is a missing value that has been defaulted, not a gym in the Gulf of Guinea.
  if (longitude === 0 && latitude === 0) {
    return undefined
  }
  return { latitude, longitude }
}

export function toGymPins(gyms: GymDto[]): GymPinsResult {
  const pins: GymPin[] = []
  gyms.forEach((gym, index) => {
    const position = readLatLng(gym)
    if (position) {
      pins.push({
        key: gym.id ?? `${readString(gym.name)}-${index}`,
        gym,
        ...position,
      })
    }
  })
  return { pins, unmappedCount: gyms.length - pins.length }
}
