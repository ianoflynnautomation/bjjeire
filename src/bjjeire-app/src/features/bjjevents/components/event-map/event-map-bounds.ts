export interface MapBounds {
  south: number
  west: number
  north: number
  east: number
}

interface MapPoint {
  latitude: number
  longitude: number
}

/** The whole island, from Mizen Head to Malin Head and Dunmore Head to the Ards. */
export const IRELAND_BOUNDS: MapBounds = {
  south: 51.3,
  west: -10.7,
  north: 55.5,
  east: -5.3,
}

/** One location collapses to a point. The map's fit options cap the zoom for that case. */
export function computeMapBounds(
  points: readonly MapPoint[],
  hasFilters: boolean
): MapBounds {
  if (!hasFilters || points.length === 0) {
    return IRELAND_BOUNDS
  }
  const latitudes = points.map(point => point.latitude)
  const longitudes = points.map(point => point.longitude)
  return {
    south: Math.min(...latitudes),
    west: Math.min(...longitudes),
    north: Math.max(...latitudes),
    east: Math.max(...longitudes),
  }
}
