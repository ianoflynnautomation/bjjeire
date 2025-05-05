export interface BaseApiEntityModel {
    id: string; 
  }
  
  export interface GymOpeningHoursDto {
    day: string;
    openTime: string;
    closeTime: string; 
  }
  
  export interface GymLocationDto {
    address: string;
    city: string;
    country: string;
    postalCode?: string;
  }
  
  export interface GeoCoordinatesDto {
    type: string;
    coordinates?: [number, number];
  }
  
  export interface ContactDto {
    contactPerson: string; 
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: Record<string, string>; 
  }
  
  export interface GymDto extends BaseApiEntityModel {
    name: string;
    description: string;
    openingHours: GymOpeningHoursDto[];
    address: GymLocationDto;
    coordinates?: GeoCoordinatesDto;
    contact: ContactDto;
    imageUrl?: string;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
      message: string;
      code?: string;
    };
  }
  

  export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      totalItems: number;
      currentPage: number;
      pageSize: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      nextPageUrl?: string | null;
      previousPageUrl?: string | null;
    };
  }
  
  // Specific response types
  export type GymResponse = ApiResponse<GymDto>;
  export type GymListResponse = PaginatedResponse<GymDto>;
  export type DeleteGymResponse = ApiResponse<boolean>;
  
  // Request types for commands
  export interface CreateGymRequest {
    model: GymDto;
  }
  
  export interface UpdateGymRequest {
    model: GymDto;
  }
  
  export interface DeleteGymRequest {
    model: GymDto;
  }
  
  export interface GetGymsByCityPaginationQuery {
    city: string;
    page?: number; 
    pageSize?: number;
  }
  
  export interface GetGenericQuery {
    id: string;
  }