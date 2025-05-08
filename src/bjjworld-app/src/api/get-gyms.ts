import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { QueryConfig } from "../lib/react-query";
import { PaginatedResponse } from "../types/common";
import {GymDto, GetGymsByCityPaginationQuery } from "../types/gyms";


export const getGyms = ({
  city,
  page = 1,
  pageSize = 12,
}: GetGymsByCityPaginationQuery): Promise<PaginatedResponse<GymDto>> => {
  return api.get("api/gym", {
    params: {
      city,
      page,
      pageSize,
    },
  });
};

export const getGymsQueryOptions = ({
  city,
  page,
  pageSize,
}: GetGymsByCityPaginationQuery) => {
  return queryOptions({
    queryKey: ["gym", { city, page, pageSize }],
    queryFn: () => getGyms({ city, page, pageSize }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
  });
};


type UseGymsOptions = {
  city: string;
  page?: number;
  pageSize?: number;
  queryConfig?: QueryConfig<typeof getGymsQueryOptions>;
};

export const useGyms = ({
  city,
  page,
  pageSize,
  queryConfig,
}: UseGymsOptions) => {
  return useQuery({
    ...getGymsQueryOptions({ city, page, pageSize }),
    ...queryConfig,
  });
};
