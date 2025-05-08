import { CITIES } from "../constants/cities";

export interface GetGenericQuery {
    id: string;
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
  

  export interface BaseApiEntityModel {
    id: string; 
  }
  

  export type City = typeof CITIES[number] | 'all';