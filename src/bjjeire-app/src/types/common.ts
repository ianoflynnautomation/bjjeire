

export interface HateoasPagination {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: HateoasPagination;
}

export interface BaseApiEntityModel 
{
  id?: string;
  createdOnUtc?: string | null
  updatedOnUtc?: string | null;

}

// You can place this in a shared types file, e.g., src/types/common.ts or src/types/location.ts
export interface MapLocationCoordinates {
  latitude?: number | null;
  longitude?: number | null;
  // placeId?: string; // You might want to use this in the future for more precise linking
}

export interface MapLocationData {
  address?: string | null;
  venue?: string | null;
  coordinates?: MapLocationCoordinates | null;
  // You could also add placeName here if it's consistently available and useful for the query
}
