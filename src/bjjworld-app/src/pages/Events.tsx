// src/pages/EventsPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { City } from '../constants/cities'; // Ensure this path is correct
import { EventForm } from '../components/EventForm/EventForm';
import { EventCard } from '../components/EventCard/EventCard';
import { EventFilters } from '../components/EventCard/EventFilters'; // Assuming you might rename the folder/component
import Pagination from '../components/Pagination'; // Your Pagination component
import LoadingSpinner from '../components/LoadingSpinner';
import { useBjjEvents } from '../api/get-bjj-events'; // This is your hook that uses usePaginatedQuery + fetchBjjEvents
import { useEventSubmission } from '../hooks/useEventSubmission'; // Ensure path is correct
import { EventFormData, BjjEventType, BjjEventDto } from '../types/event';

import clsx from 'clsx';
import { PlusIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/20/solid';

const EventsPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<BjjEventType | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<City | 'all'>('all');

  // Use the useBjjEvents hook, which internally uses usePaginatedQuery and fetchBjjEvents
  const {
    data: eventsDataFromHook,         // This is BjjEventDto[] | undefined
    pagination: paginationInfoFromHook, // This is PaginationMeta | undefined
    isLoading,                          // from useQuery
    isFetching,                         // from useQuery
    error: fetchEventsError,            // from useQuery
    currentPage: currentPageFromHook,   // from usePaginatedQuery state
    handlePageChange: handlePageChangeFromHook,
    updateFilters: updateFiltersFromHook,
    // refetch, // if usePaginatedQuery exposed refetch from useQuery, it could be used for the retry button
  } = useBjjEvents(
    // useMemo for stable initialParams reference if selectedCity/Type were complex objects
    useMemo(() => ({ city: selectedCity, type: selectedType }), [selectedCity, selectedType]),
    // initialPage and initialPageSize are passed to useBjjEvents,
    // which passes them to usePaginatedQuery. Default values are in useBjjEvents/usePaginatedQuery.
    // You can override them here if needed e.g. useBjjEvents(filters, 1, 12) for 12 items per page.
  );

  const { mutate: submitEvent, isPending: isSubmittingEvent } = useEventSubmission();

  // Memoize updateFiltersFromHook for stability in useEffect dependency array
  // (Though functions from React Query hooks are typically stable)
  const stableUpdateFilters = useCallback(updateFiltersFromHook, [updateFiltersFromHook]);

  useEffect(() => {
    // When local filter state (selectedCity, selectedType) changes,
    // call the updateFilters function from the hook.
    // The hook will then reset currentPage to 1 and trigger a refetch.
    stableUpdateFilters({ city: selectedCity, type: selectedType });
  }, [selectedCity, selectedType, stableUpdateFilters]);

  const handleSubmitEvent = useCallback(
    async (formData: EventFormData): Promise<void> => {
      return new Promise((resolve, reject) => {
        submitEvent(formData, {
          onSuccess: () => {
            setIsFormOpen(false);
            // Optionally, invalidate queries to refetch events if a new event affects the current view
            // This would require access to the queryClient from @tanstack/react-query
            // Example: queryClient.invalidateQueries({ queryKey: ['bjjEvents'] });
            resolve();
          },
          onError: (submissionError) => {
            console.error("Event submission failed:", submissionError);
            // Potentially show a user-facing error message (e.g., via a toast notification)
            reject(submissionError);
          },
        });
      });
    },
    [submitEvent] // If using queryClient, add it to dependencies
  );

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Combined handler for filter changes to also reset page and scroll
  const handleLocalFilterChange = useCallback(
    <T extends City | BjjEventType | 'all'>(
      setter: React.Dispatch<React.SetStateAction<T>>,
      value: T
    ) => {
      setter(value);
      // No need to call handlePageChangeFromHook(1) here,
      // because updateFiltersFromHook (called in useEffect) already resets the page to 1.
      scrollToTop();
    },
    [scrollToTop] // updateFiltersFromHook (via useEffect) handles page reset
  );

  const onPageChangeCallback = useCallback((newPage: number) => {
    handlePageChangeFromHook(newPage);
    scrollToTop();
  }, [handlePageChangeFromHook, scrollToTop]);

  const handleFormOpen = useCallback(() => setIsFormOpen(true), []);
  const handleFormClose = useCallback(() => setIsFormOpen(false), []);

  // Derived state for easier consumption in JSX
  const eventsToDisplay: BjjEventDto[] = eventsDataFromHook ?? [];
  const isInitialLoading = isLoading && !eventsToDisplay.length; // Show main loader only if loading and no data yet
  const isBackgroundFetching = isFetching && !isLoading; // Show subtle loader if fetching in background
  const hasError = !!fetchEventsError;
  const noEventsFound = !isLoading && !isFetching && !hasError && eventsToDisplay.length === 0;

  const userFriendlyErrorMessage = useMemo(() => {
    if (!fetchEventsError) return 'An unexpected error occurred. Please try again.';
    // Customize this based on common error messages or structures
    if (fetchEventsError.message.toLowerCase().includes('failed to fetch')) {
        return 'Could not connect to the server. Please check your internet connection and try again.';
    }
    if (fetchEventsError.message.includes('No events available')) { // Example custom check
      return 'No events are available at the moment. Please check back later.';
    }
    return fetchEventsError.message || 'Failed to load events. Please try again.';
  }, [fetchEventsError]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row md:mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            BJJ Events
          </h1>
          <button
            type="button"
            onClick={handleFormOpen}
            disabled={isSubmittingEvent}
            className={clsx(
              "inline-flex items-center justify-center gap-x-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
              isSubmittingEvent
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            {isSubmittingEvent ? 'Submitting...' : 'Submit Event'}
          </button>
        </header>

        <div className="mb-8 md:mb-10">
          <EventFilters
            selectedCity={selectedCity}
            selectedType={selectedType}
            onCityChange={(city) => handleLocalFilterChange(setSelectedCity, city)}
            onTypeChange={(type) => handleLocalFilterChange(setSelectedType, type)}
            disabled={isFetching} // Disable filters while any fetch is in progress
          />
        </div>

        <main className="relative">
          {isInitialLoading && (
            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-10 text-center shadow">
              <LoadingSpinner color="text-indigo-600" text="Loading events..." size="lg" />
            </div>
          )}
          {isBackgroundFetching && eventsToDisplay.length > 0 && ( // Only show if there's already data
            <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 shadow-lg">
              Updating...
            </div>
          )}

          {hasError && !isInitialLoading && ( // Avoid showing error on top of initial loader
            <div role="alert" className="my-10 rounded-md border border-red-300 bg-red-50 p-6 text-center shadow">
              <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-400" aria-hidden="true" />
              <h3 className="mt-2 text-lg font-semibold text-red-800">Error Loading Events</h3>
              <p className="mt-1 text-sm text-red-700">{userFriendlyErrorMessage}</p>
              <button
                onClick={() => {
                  // If refetch is available from useBjjEvents:
                  // refetch?.();
                  // Fallback to reload or a specific filter update to trigger refetch:
                  updateFiltersFromHook({ city: selectedCity, type: selectedType });
                }}
                className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Retry
              </button>
            </div>
          )}

          {noEventsFound && (
            <div className="my-10 rounded-md border border-yellow-300 bg-yellow-50 p-6 text-center shadow">
              <InformationCircleIcon className="mx-auto h-10 w-10 text-yellow-400" aria-hidden="true" />
              <p className="mt-2 text-lg font-semibold text-yellow-800">No Events Found</p>
              <p className="mt-1 text-sm text-yellow-700">
                Try adjusting your filters or{' '}
                <button onClick={handleFormOpen} className="font-medium text-indigo-600 hover:text-indigo-500">
                  submit a new event
                </button>
                .
              </p>
            </div>
          )}

          {!isInitialLoading && !hasError && eventsToDisplay.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {eventsToDisplay.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </main>

        {/* Use paginationInfoFromHook for totalPages and ensure it's defined */}
        {paginationInfoFromHook && paginationInfoFromHook.totalPages > 1 && !hasError && (
          <div className="mt-10 border-t border-slate-200 pt-8 md:mt-12">
            <Pagination
              currentPage={currentPageFromHook} // Use currentPage directly from the hook
              totalPages={paginationInfoFromHook.totalPages}
              onPageChange={onPageChangeCallback}
              // Your Pagination component can be extended to accept isLoading/isFetching
              // to disable controls:
              // disabled={isFetching}
            />
          </div>
        )}

        {isFormOpen && (
          <EventForm
            isOpen={isFormOpen}
            onClose={handleFormClose}
            onSubmit={handleSubmitEvent}
            isSubmitting={isSubmittingEvent}
          />
        )}
      </div>
    </div>
  );
};

export default EventsPage;