import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { PaginatedResponse } from '../types/common';
import { BjjEventDto, BackendBjjEventDto, GetBjjEventsPaginationQuery, BjjEventType, ScheduleType } from '../types/event';
import { City } from '../constants/cities';

// Map backend string type to frontend BjjEventType
const mapBackendTypeToBjjEventType = (backendType: string): BjjEventType => {
  // First try to parse as a number (in case it's already a numeric enum value)
  const numericType = parseInt(backendType, 10);
  if (!isNaN(numericType)) {
    return numericType as BjjEventType;
  }

  // If it's a string, map it to the corresponding enum value
  switch (backendType.toLowerCase()) {
    case 'openmat':
      return BjjEventType.OpenMat; // 0
    case 'seminar':
      return BjjEventType.Seminar; // 1
    case 'tournament':
      return BjjEventType.Tournament; // 2
    case 'camp':
      return BjjEventType.Camp; // 3
    case 'other':
    default:
      return BjjEventType.Other; // 4
  }
};

// Map day string to dayOfWeek number
const mapDayToDayOfWeek = (day: string): number | null => {
  switch (day.toLowerCase()) {
    case 'sunday':
      return 0;
    case 'monday':
      return 1;
    case 'tuesday':
      return 2;
    case 'wednesday':
      return 3;
    case 'thursday':
      return 4;
    case 'friday':
      return 5;
    case 'saturday':
      return 6;
    default:
      return null; // Invalid day
  }
};

const normalizeEvent = (event: BackendBjjEventDto): BjjEventDto => {
  try {
    // Handle socialMedia to filter out null or empty values
    const socialMedia = event.contact?.socialMedia
      ? Object.fromEntries(
          Object.entries(event.contact.socialMedia).filter(([, value]) => value !== null && value.trim() !== '')
        ) as { [key: string]: string }
      : null;

    // Log the event type before and after mapping
    console.log('Original event type:', event.type);
    const mappedType = mapBackendTypeToBjjEventType(event.type || '');
    console.log('Mapped event type:', mappedType);

    return {
      name: event.name || 'Unnamed Event',
      type: mappedType,
      eventUrl: event.eventUrl || null,
      isActive: event.isActive ?? true,
      statusReason: event.statusReason || null,
      address: event.address || '',
      city: event.city || '',
      schedule: {
        scheduleType: (event.schedule?.scheduleType as ScheduleType) || ScheduleType.Recurring,
        startDate: event.schedule?.startDate || null,
        endDate: event.schedule?.endDate || null,
        hours: Array.isArray(event.schedule?.hours)
          ? event.schedule.hours.map((h) => ({
              dayOfWeek: h.day ? mapDayToDayOfWeek(h.day) : null,
              date: h.date ?? null,
              openTime: h.openTime || '00:00:00',
              closeTime: h.closeTime || '00:00:00',
            }))
          : [],
      },
      contact: {
        contactPerson: event.contact?.contactPerson || '',
        phone: event.contact?.phone || null,
        email: event.contact?.email || null,
        website: event.contact?.website || null,
        socialMedia,
      },
      coordinates: {
        type: event.coordinates?.type || 'Point',
        latitude: event.coordinates?.latitude ?? 0,
        longitude: event.coordinates?.longitude ?? 0,
        placeName: event.coordinates?.placeName || '',
        placeId: event.coordinates?.placeId || null,
      },
      cost: event.cost ?? null,
    };
  } catch (err) {
    console.error('Normalization error for event:', event, err);
    throw new Error(`Failed to normalize event: ${(err as Error).message}`);
  }
};

// Version 1: Backend returns PaginatedResponse<BackendBjjEventDto>
export const getBjjEvent = async ({
  page = 1,
  pageSize = 12,
  city,
  type,
  scheduleType,
  startDate,
  endDate,
}: GetBjjEventsPaginationQuery): Promise<PaginatedResponse<BjjEventDto>> => {
  try {
    const response = await api.get<BackendBjjEventDto[] | PaginatedResponse<BackendBjjEventDto>>('/api/bjjevent', {
      params: {
        page,
        pageSize,
        city: city === 'all' ? undefined : city,
        type: type === 'all' ? undefined : type,
        scheduleType: scheduleType === 'all' ? undefined : scheduleType,
        startDate,
        endDate,
      },
    });

    console.log('Raw API response (getBjjEvent):', response.data);

    // Handle both array and paginated response formats
    const eventsArray = Array.isArray(response.data) 
      ? response.data 
      : Array.isArray(response.data.data) 
        ? response.data.data 
        : [];

    const normalizedData = eventsArray.map((item: BackendBjjEventDto) => {
      try {
        const normalized = normalizeEvent(item);
        console.log('Normalized event:', normalized);
        return normalized;
      } catch (err) {
        console.error('Skipping invalid event:', item, err);
        return null;
      }
    }).filter((item): item is BjjEventDto => item !== null);

    console.log('Normalized data:', normalizedData);

    // Calculate pagination info
    const totalItems = normalizedData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = normalizedData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        currentPage: page,
        pageSize,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPageUrl: page < totalPages ? `?page=${page + 1}` : null,
        previousPageUrl: page > 1 ? `?page=${page - 1}` : null,
      },
    };
  } catch (error) {
    console.error('getBjjEvent error:', error);
    throw new Error(`Failed to fetch events: ${(error as Error).message}`);
  }
};

// Version 2: Backend returns ApiResponse<PaginatedResponse<BackendBjjEventDto>>
// Uncomment this version if the backend wraps the response in ApiResponse
/*
export const getBjjEvent = async ({
  page = 1,
  pageSize = 12,
  city,
  type,
  scheduleType,
  startDate,
  endDate,
}: GetBjjEventsPaginationQuery): Promise<PaginatedResponse<BjjEventDto>> => {
  try {
    const response = await api.get<ApiResponse<PaginatedResponse<BackendBjjEventDto>>>('/api/bjjevent', {
      params: {
        page,
        pageSize,
        city: city === 'all' ? undefined : city,
        type: type === 'all' ? undefined : type,
        scheduleType: scheduleType === 'all' ? undefined : scheduleType,
        startDate,
        endDate,
      },
    });

    console.log('Raw API response (getBjjEvent):', response.data); // Log to confirm structure

    return {
      data: Array.isArray(response.data.data.data)
        ? response.data.data.data.map((item: BackendBjjEventDto) => {
            try {
              return normalizeEvent(item);
            } catch (err) {
              console.error('Skipping invalid event:', item, err);
              return null;
            }
          }).filter((item): item is BjjEventDto => item !== null)
        : [],
      pagination: response.data.data.pagination ?? {
        currentPage: page,
        pageSize,
        totalPages: 1,
        totalItems: 0,
      },
    };
  } catch (error) {
    console.error('getBjjEvent error:', error);
    throw new Error(`Failed to fetch events: ${(error as Error).message}`);
  }
};
*/

export const getBjjEventQueryOptions = ({
  page,
  pageSize,
  city,
  type,
  scheduleType,
  startDate,
  endDate,
}: GetBjjEventsPaginationQuery) => {
  return queryOptions({
    queryKey: ['bjjEvent', { page, pageSize, city, type, scheduleType, startDate, endDate }],
    queryFn: () => getBjjEvent({ page, pageSize, city, type, scheduleType, startDate, endDate }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  });
};

type UseBjjEventsOptions = {
  page?: number;
  pageSize?: number;
  city?: City | 'all';
  type?: BjjEventType | 'all';
  scheduleType?: ScheduleType | 'all';
  startDate?: string;
  endDate?: string;
};

export const useBjjEvents = ({
  page = 1,
  pageSize = 12,
  city = 'all',
  type = 'all',
  scheduleType = 'all',
  startDate,
  endDate,
}: UseBjjEventsOptions) => {
  const query = useQuery(getBjjEventQueryOptions({ page, pageSize, city, type, scheduleType, startDate, endDate }));
  if (query.error) {
    console.error('useBjjEvents error:', query.error);
  }
  return query;
};