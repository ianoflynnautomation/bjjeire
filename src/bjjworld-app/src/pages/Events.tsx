import React, { useCallback, useState, memo } from 'react';
import { City } from '../constants/cities';
import { EventForm } from '../components/EventForm/EventForm';
import { EventCard } from '../components/EventCard/EventCard';
import EventFilters from '../components/EventFilters/EventFilters';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import { getBjjEvents } from '../api/get-bjj-events';
import { useEventSubmission } from '../hooks/useEventSubmission';
import { EventFormData, BjjEventType, BjjEventDto, GetBjjEventsPaginationQuery } from '../types/event';
import clsx from 'clsx';
import { PlusIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/20/solid';

// Subcomponent for loading state
const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading events...' }) => (
  <div className="flex justify-center rounded-lg bg-white p-10 shadow">
    <LoadingSpinner color="text-indigo-600" text={message} size="lg" />
  </div>
);

// Subcomponent for error state
const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div
    role="alert"
    className="my-10 rounded-md border border-red-300 bg-red-50 p-6 text-center shadow"
  >
    <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-400" aria-hidden="true" />
    <h3 className="mt-2 text-lg font-semibold text-red-800">Error Loading Events</h3>
    <p className="mt-1 text-sm text-red-700">{message}</p>
    <button
      onClick={onRetry}
      className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      Retry
    </button>
  </div>
);

// Subcomponent for no events found
const NoEventsState: React.FC<{ onOpenForm: () => void }> = ({ onOpenForm }) => (
  <div className="my-10 rounded-md border border-yellow-300 bg-yellow-50 p-6 text-center shadow">
    <InformationCircleIcon className="mx-auto h-10 w-10 text-yellow-400" aria-hidden="true" />
    <p className="mt-2 text-lg font-semibold text-yellow-800">No Events Found</p>
    <p className="mt-1 text-sm text-yellow-700">
      Try adjusting your filters or{' '}
      <button
        onClick={onOpenForm}
        className="font-medium text-indigo-600 hover:text-indigo-500"
      >
        submit a new event
      </button>
      .
    </p>
  </div>
);

// Main EventsPage component
const EventsPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filters, setFilters] = useState<GetBjjEventsPaginationQuery>({
    city: 'all',
    type: undefined,
    page: 1,
    pageSize: 12,
  });

  const {
    data,
    pagination,
    isLoading,
    isFetching,
    error,
    currentPage,
    handlePageChange,
    updateFilters,
  } = usePaginatedQuery<BjjEventDto, GetBjjEventsPaginationQuery>({
    queryKeyBase: ['bjjEvents'],
    fetchFn: getBjjEvents, // Use getBjjEvents instead of getBjjEventsQueryOptions
    initialParams: filters,
  });

  const { mutate: submitEvent, isPending: isSubmittingEvent } = useEventSubmission();

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFilterChange = useCallback(
    (key: keyof GetBjjEventsPaginationQuery, value: City | BjjEventType | 'all') => {
      const newFilters: Partial<GetBjjEventsPaginationQuery> = {};
      if (key === 'city') {
        newFilters.city = value as City | 'all';
      } else if (key === 'type') {
        newFilters.type = value === 'all' ? undefined : (value as BjjEventType);
      }
      setFilters((prev) => ({ ...prev, ...newFilters }));
      updateFilters(newFilters);
      scrollToTop();
    },
    [updateFilters, scrollToTop]
  );

  const onPageChange = useCallback(
    (url: string | null, page?: number) => {
      handlePageChange(url, page);
      scrollToTop();
    },
    [handlePageChange, scrollToTop]
  );

  const handleSubmitEvent = useCallback(
    (formData: EventFormData): Promise<void> =>
      new Promise((resolve, reject) => {
        submitEvent(formData, {
          onSuccess: () => {
            setIsFormOpen(false);
            updateFilters(filters); // Refresh events
            resolve();
          },
          onError: (error) => {
            console.error('Event submission failed:', error);
            reject(error);
          },
        });
      }),
    [submitEvent, updateFilters, filters]
  );

  const events = data ?? [];
  const isInitialLoading = isLoading && !events.length;
  const isBackgroundFetching = isFetching && !isLoading;
  const hasError = !!error;
  const noEventsFound = !isLoading && !isFetching && !hasError && !events.length;

  const errorMessage = error?.message.includes('failed to fetch')
    ? 'Could not connect to the server. Please check your internet connection and try again.'
    : error?.message || 'Failed to load events. Please try again.';

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            BJJ Events
          </h1>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            disabled={isSubmittingEvent}
            className={clsx(
              'inline-flex items-center gap-x-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm',
              isSubmittingEvent
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            )}
            aria-controls="event-form"
            aria-expanded={isFormOpen}
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            {isSubmittingEvent ? 'Submitting...' : 'Submit Event'}
          </button>
        </header>

        <div className="mb-8">
          <EventFilters
            selectedCity={filters.city}
            selectedType={filters.type}
            onCityChange={(city) => handleFilterChange('city', city)}
            onTypeChange={(type) => handleFilterChange('type', type)}
            disabled={isFetching}
          />
        </div>

        <main className="relative" aria-live="polite">
          {isInitialLoading && <LoadingState />}
          {isBackgroundFetching && events.length > 0 && (
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 shadow-lg"
              aria-live="polite"
            >
              Updating...
            </div>
          )}
          {hasError && !isInitialLoading && (
            <ErrorState message={errorMessage} onRetry={() => updateFilters(filters)} />
          )}
          {noEventsFound && <NoEventsState onOpenForm={() => setIsFormOpen(true)} />}
          {!isInitialLoading && !hasError && events.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </main>

        {pagination && pagination.totalPages > 1 && !hasError && (
          <div className="mt-10 border-t border-slate-200 pt-8">
            <Pagination
              currentPage={currentPage}
              pagination={pagination}
              onPageChange={onPageChange}
            />
          </div>
        )}

        {isFormOpen && (
          <EventForm
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleSubmitEvent}
            isSubmitting={isSubmittingEvent}
          />
        )}
      </div>
    </div>
  );
};

export default memo(EventsPage);