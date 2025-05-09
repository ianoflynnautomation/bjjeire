import React, { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CITIES, City } from '../constants/cities';
import { BJJ_EVENT_TYPES } from '../constants/eventTypes';
import { EventForm } from '../components/EventForm/EventForm';
import { EventCard } from '../components/EventCard/EventCard';
import Pagination  from '../components/Pagination';
import  LoadingSpinner  from '../components/LoadingSpinner';
import { useBjjEvents } from '../api/get-bjj-events';
import { api } from '../lib/api-client';
import {
  BjjEventType,
  EventFormData,
  GetBjjEventsPaginationQuery,
  mapEventFormDataToDto,
} from '../types/event';

const Events: React.FC = () => {
  const [selectedType, setSelectedType] = useState<BjjEventType | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<City | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const queryClient = useQueryClient();

  const queryParams = useMemo((): GetBjjEventsPaginationQuery => ({
    page: currentPage,
    pageSize,
    city: selectedCity,
    type: selectedType,
  }), [currentPage, selectedCity, selectedType]);

  const {
    data: eventsResponse,
    isLoading,
    isFetching,
    error,
  } = useBjjEvents(queryParams);

  const handleSubmitEvent = useCallback(
    async (formData: EventFormData): Promise<void> => {
      try {
        const apiPayload = mapEventFormDataToDto(formData);
        await api.post('/api/bjjevent', apiPayload);
        await queryClient.invalidateQueries({ queryKey: ['bjjEvent'] });
        setIsFormOpen(false);
        alert('Event submitted successfully! It will appear after processing.');
      } catch (err) {
        console.error('Failed to submit event:', err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        alert(`Failed to submit event: ${message}`);
        throw err;
      }
    },
    [queryClient]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCityDropdownChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value as City | 'all');
    setCurrentPage(1);
  }, []);

  const handleTypeButtonClick = useCallback((typeValue: BjjEventType | 'all') => {
    setSelectedType(typeValue);
    setCurrentPage(1);
  }, []);

  const events = Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEvents = events.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(events.length / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12 antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
              BJJ Events
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
                {BJJ_EVENT_TYPES.map(({ value, label }) => (
                  <button
                    key={value.toString()}
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
                {CITIES.filter(city => city !== 'all').map((cityConst) => (
                  <option key={cityConst} value={cityConst}>
                    {cityConst}
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
                onClick={() => queryClient.refetchQueries({ queryKey: ['bjjEvent'] })}
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
              {paginatedEvents.map((event) => (
                <EventCard
                  key={event.name}
                  event={event}
                />
              ))}
            </div>
          )}
        </main>

        {!isLoading && !error && events.length > 0 && (
          <div className="mt-10 md:mt-12">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {isFormOpen && (
        <EventForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmitEvent}
        />
      )}
    </div>
  );
};

export default Events;