

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
