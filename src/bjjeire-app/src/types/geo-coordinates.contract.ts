import type { components } from '@/types/generated/api'
import type { GeoCoordinatesDto } from '@/types/common'

type WirePoint = components['schemas']['GeoCoordinates']

type LatitudeStaysOptional = undefined extends GeoCoordinatesDto['latitude']
  ? true
  : never
type LongitudeStaysOptional = undefined extends GeoCoordinatesDto['longitude']
  ? true
  : never

type WirePointWithDerived = WirePoint & {
  type: 'Point'
  coordinates: [number, number]
  latitude: number
  longitude: number
}
type WirePointFitsHandwritten = WirePointWithDerived extends GeoCoordinatesDto
  ? true
  : never

// Separate checks. An intersection of `true` is redundant, and the lint fixer deletes it.
export const geoCoordinatesContractOk = [
  true satisfies LatitudeStaysOptional,
  true satisfies LongitudeStaysOptional,
  true satisfies WirePointFitsHandwritten,
] as const
