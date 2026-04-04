export interface HateoasPagination {
  totalItems: number
  currentPage: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  nextPageUrl: string | null
  previousPageUrl: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: HateoasPagination
}

export interface BaseApiEntityModel {
  id?: string
  createdOnUtc?: string | null
  updatedOnUtc?: string | null
}

export interface MapLocationCoordinates {
  latitude?: number | null
  longitude?: number | null
}

export interface MapLocationData {
  address?: string | null
  venue?: string | null
  coordinates?: MapLocationCoordinates | null
}

export interface GeoCoordinatesDto {
  type: 'Point'
  coordinates: [number, number]
  latitude: number
  longitude: number
  placeName?: string | null
  placeId?: string | null
}

export interface SocialMediaDto {
  instagram?: string
  facebook?: string
  x?: string
  youTube?: string
}

export interface LocationDto {
  address: string
  venue: string
  coordinates: GeoCoordinatesDto
}
