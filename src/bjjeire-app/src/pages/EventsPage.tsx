import React, { useCallback, useState, memo, useMemo } from 'react';
import { useBjjEvents } from '../api/get-bjj-events';
import { County } from '../constants/counties';
import { useEventSubmission } from '../hooks/useEventSubmission';
import { EventFormData, BjjEventType, GetBjjEventsPaginationQuery } from '../types/event';
import { EventForm } from '../components/Events/EventForm/EventForm';
import EventFilters from '../components/Events/EventFilters/EventFilters';
import Pagination from '../components/Pagination';
import LoadingState from '../components/Events/EventsPageFeedback/LoadingState';
import ErrorState from '../components/Events/EventsPageFeedback/ErrorState';
import NoDataState from '../components/Events/EventsPageFeedback/NoDataState';
import BackgroundFetchingIndicator from '../components/Events/EventsPageFeedback/BackgroundFetchingIndicator';
import EventsPageHeader from '../components/Events/EventsPageHeader';
import EventsList from '../components/Events/EventsList';

const DEFAULT_PAGE_SIZE = 12;

const EventsPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<GetBjjEventsPaginationQuery>({
    county:'all',
    type: undefined,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const {
    data: bjjEventsResponse,
    isLoading,
    isFetching,
    error: fetchError, // Renamed to avoid conflict with submission error
    refetch,
  } = useBjjEvents({
    county: activeFilters.county,
    type: activeFilters.type,
    page: activeFilters.page,
    pageSize: activeFilters.pageSize,
  });

  // Use the NEW useEventSubmission hook
  const { mutate: submitEvent, isPending: isSubmittingEvent } = useEventSubmission();

  const events = useMemo(() => bjjEventsResponse?.data ?? [], [bjjEventsResponse?.data]);
  const paginationInfo = useMemo(() => bjjEventsResponse?.pagination, [bjjEventsResponse?.pagination]);

  const scrollToTop = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleFilterChange = useCallback(
    (
      key: keyof Omit<GetBjjEventsPaginationQuery, 'page' | 'pageSize'>,
      value: County | BjjEventType | 'all' | undefined
    ) => {
      setActiveFilters((prevFilters) => {
        const newFilters: Partial<GetBjjEventsPaginationQuery> = { page: 1 };
        if (key === 'county') {
          newFilters.county = value as County | 'all' | undefined; // Explicitly allow undefined
        } else if (key === 'type') {
          newFilters.type = value === 'all' ? undefined : (value as BjjEventType | undefined);
        }
        return { ...prevFilters, ...newFilters };
      });
      scrollToTop();
    },
    [scrollToTop]
  );

  const onPageChange = useCallback(
    (_url: string | null, page?: number) => {
      if (page && page !== activeFilters.page) {
        setActiveFilters((prevFilters) => ({ ...prevFilters, page }));
        scrollToTop();
      }
    },
    [activeFilters.page, scrollToTop]
  );

  const handleSubmitEvent = useCallback(
    (formData: EventFormData): Promise<void> =>
      new Promise((resolve, reject) => {
        submitEvent(formData, { // Pass variables and component-specific callbacks
          onSuccess: (data) => { // data is the response from postEvent
            setIsFormOpen(false);
            // Toast message for success can be handled here or globally in the hook
            // e.g., toast.success('Event submitted successfully for review!');
            // Query invalidation is handled by the useEventSubmission hook, so no manual refetch needed.
            console.log('Event submission successful (component level):', data);
            resolve();
          },
          onError: (error) => { // error is the submission error
            console.error('Event submission failed (component level):', error);
            // Consider user-facing notification for submission error (e.g., toast)
            // The global error log is in useEventSubmission hook
            reject(error);
          },
        });
      }),
    [submitEvent] // submitEvent (mutate function from useMutation) is stable
  );

  const handleRetryFetch = useCallback(() => {
    refetch();
  }, [refetch]);

  const isInitialLoading = isLoading && events.length === 0;
  const isBackgroundFetching = isFetching && !isLoading;
  const hasFetchError = !!fetchError;
  const noEventsFound = !isInitialLoading && !hasFetchError && events.length === 0 && !isFetching;

  const fetchErrorMessage = useMemo(() => {
    if (!fetchError) return '';
    if (fetchError instanceof Error) {
      return fetchError.message?.includes('failed to fetch') || fetchError.message?.includes('NetworkError')
        ? 'Could not connect to the server. Please check your internet connection and try again.'
        : fetchError.message || 'An unexpected error occurred while loading events. Please try again.';
    }
    return 'An unexpected error occurred.';
  }, [fetchError]);

  // You might want a similar message for submissionError if you display it directly
  // const submissionErrorMessage = useMemo(() => { ... }, [submissionError]);

  const renderMainContent = () => {
    if (isInitialLoading) return <LoadingState />;
    if (hasFetchError) return <ErrorState message={fetchErrorMessage} onRetry={handleRetryFetch} />;
    if (noEventsFound) return (
      <NoDataState
        title="No Events Found"
        messageLine1="No events match your current filters."
        messageLine2="Why not try a different filter or submit a new event?"
        actionText="Submit a new event"
        onActionClick={() => setIsFormOpen(true)}
      />
    );
    if (events.length > 0) return <EventsList events={events} />;
    return null;
  };

  return (
    <div className="min-h-screen dark:bg-slate-900 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <EventsPageHeader
          onOpenForm={() => setIsFormOpen(true)}
          isSubmittingEvent={isSubmittingEvent} // from new useEventSubmission
          isFormOpen={isFormOpen}
        />

        <div className="mb-8">
          <EventFilters
            selectedCity={activeFilters.county}
            selectedType={activeFilters.type}
            onCityChange={(city) => handleFilterChange('county', city)}
            onTypeChange={(type) => handleFilterChange('type', type)}
            disabled={isFetching || isLoading || isSubmittingEvent} // Disable if any operation is ongoing
          />
        </div>

        <main className="relative" aria-live="polite" aria-busy={isFetching || isSubmittingEvent}>
          {isBackgroundFetching && events.length > 0 && <BackgroundFetchingIndicator />}
          {renderMainContent()}
        </main>

        {paginationInfo && paginationInfo.totalPages > 1 && !hasFetchError && events.length > 0 && (
          <div className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-700">
            <Pagination
              currentPage={activeFilters.page}
              pagination={paginationInfo}
              onPageChange={onPageChange}
            />
          </div>
        )}

        {isFormOpen && (
          <EventForm
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleSubmitEvent}
            isSubmitting={isSubmittingEvent} // from new useEventSubmission
            // submissionError={submissionError} // Optionally pass submission error to form
          />
        )}
      </div>
    </div>
  );
};

export default memo(EventsPage);