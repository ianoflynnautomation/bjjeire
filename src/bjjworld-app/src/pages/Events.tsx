// src/pages/Events.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { CITIES } from '../constants/cities'; // Your ['Cork', 'Dublin']
import EventForm from '../components/EventForm';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EventCard from '../components/EventCard';
import { useQueryClient } from '@tanstack/react-query';
import { useBjjEvents } from '../api/get-bjj-events'; // Your actual hook
import { api } from '../lib/api-client';
import {
  BjjEventDto,
  BjjEventType,      // This is your enum (numbers)
  BJJ_EVENT_TYPES,   // This is your array for UI mapping { value: BjjEventType | 'all', label: string }
  EventFormData,     // Form data type (uses string EventType 'open-mat', etc.)
  mapEventTypeToBjjEventType, // Your mapping function
  GeoCoordinatesDto, // For type safety
  ContactDto,        // For type safety
  BjjEventHoursDto,  // For type safety
  // City type from EventFormData is 'Cork' | 'Dublin'
} from '../types/event';

// Define City type based on your EventFormData or a shared type if available
type PageCityType = 'Cork' | 'Dublin';


const Events: React.FC = () => {
  // selectedType uses BjjEventType enum values or 'all' string, matching BJJ_EVENT_TYPES array structure
  const [selectedType, setSelectedType] = useState<BjjEventType | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<PageCityType | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const queryClient = useQueryClient();

  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    city: selectedCity, // Directly pass 'all' or the specific city string
    type: selectedType, // Directly pass 'all' or BjjEventType enum value
  }), [currentPage, selectedCity, selectedType, pageSize]);

  const {
    data: eventsResponse, // This is PaginatedResponse<BjjEventDto> or equivalent BjjEventsResponseDto
    isLoading,
    isFetching,
    error,
  } = useBjjEvents(queryParams);


  const handleSubmitEvent = useCallback(
    async (formData: EventFormData): Promise<void> => { // Explicit Promise<void>
      try {
        // Prepare data for the API, matching BjjEventDto structure
        const apiPayload: Omit<BjjEventDto, 'id' | 'createdOnUtc' | 'updatedOnUtc' | 'eventUrl' | 'cost' | 'bjjEventHours' | 'contact' | 'coordinates' > & {
            eventUrl?: string;
            cost?: number;
            bjjEventHours: BjjEventHoursDto[];
            contact: ContactDto;
            coordinates: GeoCoordinatesDto;
        } = {
          eventName: formData.title,
          type: mapEventTypeToBjjEventType(formData.type), // Maps 'open-mat' to BjjEventType.OpenMat (number)
          isActive: true,
          statusReason: null,
          address: `${formData.city}, Switzerland`, // Assuming all events are in CH despite Dublin option
          // Optional fields from EventFormData or defaults:
          // eventUrl: formData.eventUrl || undefined, (if you add eventUrl to EventFormData)
          // cost: formData.cost ? Number(formData.cost) : undefined, (if you add cost to EventFormData)

          // Default/empty values for complex types not in EventFormData
          bjjEventHours: [], // Populate if form collects this, else default
          contact: { // Populate from form if fields exist, else defaults
            contactPerson: '', // Or formData.contactName if you add it
            email: formData.contactEmail,
            // phone: formData.phone,
            // website: formData.website,
            // socialMedia: {}
          },
          coordinates: { // CRITICAL: Implement proper geocoding or map input for these
            type: 'Point',
            // Placeholder - replace with actual geocoding based on formData.city or a map input
            latitude: formData.city === 'Cork' ? 47.3769 : 53.3498, // Cork vs Dublin approx.
            longitude: formData.city === 'Cork' ? 8.5417 : -6.2603, // Cork vs Dublin approx.
            placeName: `${formData.title} in ${formData.city}`,
            // placeId: undefined, // If you get a Google Place ID
          },
        };

        await api.post('/api/bjjevent', apiPayload);
        // Invalidate queries to refetch event list. Matches the queryKey in useBjjEvents.
        await queryClient.invalidateQueries({ queryKey: ['bjjEvent', { page: queryParams.page, pageSize: queryParams.pageSize, city: queryParams.city, type: queryParams.type }] });
        // Or more broadly:
        // await queryClient.invalidateQueries({ queryKey: ['bjjEvent'], exact: false });

        setIsFormOpen(false);
        alert('Event submitted successfully! It will appear after processing.');
      } catch (err) {
        console.error('Failed to submit event:', err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        alert(`Failed to submit event: ${message}`);
        throw err; // Re-throw to allow EventForm to handle its state if needed
      }
    },
    [queryClient, queryParams] // queryParams is dependency for specific invalidation
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Type for city dropdown change handler
  const handleCityDropdownChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value as PageCityType | 'all');
    setCurrentPage(1);
  }, []);

  // Type for filter button click handler
  const handleTypeButtonClick = useCallback((typeValue: BjjEventType | 'all') => {
    setSelectedType(typeValue);
    setCurrentPage(1);
  }, []);

  const redirectToGoogleMaps = useCallback((coordinates: GeoCoordinatesDto) => {
    if (!coordinates || (coordinates.latitude == null || coordinates.longitude == null) && !coordinates.placeId && !coordinates.placeName) {
        alert("Location data is incomplete for this event.");
        return;
    }
    let mapsUrl: string;
    if (coordinates.placeId) { // placeId is more reliable
      mapsUrl = `https://www.google.com/maps/search/?api=1&query_place_id=${coordinates.placeId}`;
    } else if (coordinates.latitude != null && coordinates.longitude != null) {
      const query = coordinates.placeName ? encodeURIComponent(coordinates.placeName) : `${coordinates.latitude},${coordinates.longitude}`;
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    } else if (coordinates.placeName) { // Fallback to placename
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates.placeName)}`;
    }
     else { return; }
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  }, []);


  const events = eventsResponse?.data || []; // data is BjjEventDto[]
  const paginationInfo = eventsResponse?.pagination; // pagination is PaginationDto

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12 antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
              BJJ Events Ireland
            </h1>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Submit Event
            </button>
          </div>
        </header>

        <section className="mb-8 md:mb-10 p-5 sm:p-6 bg-white rounded-xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6 items-end">
            <div className="md:col-span-3">
              <label htmlFor="eventTypeFilter" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Event Type
              </label>
              <div id="eventTypeFilter" className="flex flex-wrap gap-2">
                {BJJ_EVENT_TYPES.map(({ value, label }) => ( // Using your BJJ_EVENT_TYPES array
                  <button
                    key={value.toString()} // value can be number or 'all'
                    onClick={() => handleTypeButtonClick(value)}
                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400
                      ${selectedType === value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="cityFilter" className="block text-sm font-semibold text-gray-700 mb-1.5">
                City
              </label>
              <select
                id="cityFilter"
                value={selectedCity}
                onChange={handleCityDropdownChange}
                className="w-full py-2.5 px-3.5 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm appearance-none bg-no-repeat bg-right pr-8"
                style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="gray" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M4.516 7.548c.436-.446 1.043-.48 1.576 0L10 11.464l3.908-3.916c.533-.48 1.14-.446 1.576 0 .436.445.408 1.197 0 1.615L10.817 13.86a1.213 1.213 0 01-1.634 0L4.516 9.163c-.409-.418-.436-1.17 0-1.615z"></path></svg>')`, backgroundPosition: 'right 0.7rem center' }}
              >
                <option value="all">All Cities</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <main>
          {(isLoading || isFetching) && <LoadingSpinner color="text-blue-600" text={isFetching && !isLoading ? "Updating events..." : "Loading events..."} className="my-10" />}
          {error && !isLoading && (
            <div className="text-center my-10 p-6 bg-red-50 border border-red-200 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-red-700 mb-2">Error Loading Events</h3>
              <p className="text-red-600 mb-4">{(error as Error).message || "An unknown error occurred."}</p>
              <button
                onClick={() => queryClient.refetchQueries({ queryKey: ['bjjEvent'] })} // General refetch for this query
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && events.length === 0 && (
            <div className="text-center my-10 p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-md">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75S7.615 6 12 6c1.674 0 3.245.424 4.633 1.185m-.001 2.647a.75.75 0 000-1.061l-3.75-3.75a.75.75 0 00-1.06 0l-3.75 3.75a.75.75 0 101.06 1.06L12 9.31l3.395 3.396a.75.75 0 001.06 0zm-3.752-.935a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75v-.008a.75.75 0 00-.75-.75h-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xl font-semibold text-yellow-700">
                No Events Found
              </p>
              <p className="text-yellow-600 text-sm">
                Try adjusting your filters or check back later.
              </p>
            </div>
          )}

          {!isLoading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onViewOnMap={redirectToGoogleMaps} />
              ))}
            </div>
          )}
        </main>

        {paginationInfo && paginationInfo.totalPages > 1 && !isLoading && events.length > 0 && (
          <div className="mt-10 md:mt-12">
            <Pagination
              currentPage={paginationInfo.currentPage}
              totalPages={paginationInfo.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <EventForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitEvent}
      />
    </div>
  );
};

export default Events;