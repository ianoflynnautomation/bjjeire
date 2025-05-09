import React, { useState, useEffect } from 'react';
import { City } from '../constants/cities';
import { EventForm } from '../components/EventForm/EventForm';
import { EventCard } from '../components/EventCard/EventCard';
import { EventFilters } from '../components/EventCard/EventFilters';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { useBjjEvents } from '../api/get-bjj-events';
import { useEventSubmission } from '../hooks/useEventSubmission';
import { EventFormData, BjjEventType } from '../types/event';

const EventsPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<BjjEventType | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<City | 'all'>('all');

  const { data: events, pagination, isLoading, isFetching, error, handlePageChange, updateFilters } =
    useBjjEvents({ city: selectedCity, type: selectedType });

  const { mutate: submitEvent, isPending: isSubmitting } = useEventSubmission();

  useEffect(() => {
    updateFilters({ city: selectedCity, type: selectedType });
  }, [selectedCity, selectedType, updateFilters]);

  const handleSubmitEvent = async (formData: EventFormData): Promise<void> => {
    return new Promise((resolve, reject) => {
      submitEvent(formData, {
        onSuccess: () => {
          setIsFormOpen(false);
          resolve();
        },
        onError: (_) => {
          reject(_);
        },
      });
    });
  };

  const handleCityChange = (city: City | 'all') => {
    setSelectedCity(city);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTypeChange = (type: BjjEventType | 'all') => {
    setSelectedType(type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onPageChange = (page: number) => {
    handlePageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormOpen = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const displayEvents = events ?? [];
  const isLoadingEvents = isLoading || (isFetching && !displayEvents.length);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <header className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <h1 className="text-3xl font-bold text-gray-800">BJJ Events</h1>
          <button
            onClick={handleFormOpen}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            {isSubmitting ? 'Submitting...' : 'Submit Event'}
          </button>
        </header>

        <EventFilters
          selectedCity={selectedCity}
          selectedType={selectedType}
          onCityChange={handleCityChange}
          onTypeChange={handleTypeChange}
        />

        <main>
          {isLoadingEvents && (
            <LoadingSpinner color="text-blue-600" text="Loading events..." className="my-10" />
          )}
          {isFetching && !isLoading && displayEvents.length > 0 && (
            <div className="py-4 text-center text-gray-600">Updating...</div>
          )}
          {error && !isLoading && (
            <div className="my-10 rounded-md bg-red-50 p-6 text-center">
              <h3 className="mb-2 text-lg font-semibold text-red-700">Error Loading Events</h3>
              <p className="text-red-600">
                {error.message.includes('response.data')
                  ? 'No events available at the moment. Please try again later.'
                  : error.message || 'Failed to load events. Please try again.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}
          {!isLoading && !error && !displayEvents.length && (
            <div className="my-10 rounded-md bg-yellow-50 p-6 text-center">
              <p className="text-lg font-semibold text-yellow-700">No Events Found</p>
              <p className="text-sm text-yellow-600">Try adjusting your filters or submitting a new event.</p>
            </div>
          )}
          {!isLoading && !error && displayEvents.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </main>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-10">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}

        {isFormOpen && (
          <EventForm
            isOpen={isFormOpen}
            onClose={handleFormClose}
            onSubmit={handleSubmitEvent}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};

export default EventsPage;