import React, { useCallback, useState, memo, useMemo } from 'react';
import { City } from '../constants/cities'; 
import { EventForm } from '../components/Events/EventForm/EventForm'; 
import EventFilters from '../components/Events/EventFilters/EventFilters'; 
import Pagination from '../components/Pagination'; 
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'; 
import { getBjjEvents } from '../api/get-bjj-events'; 
import { useEventSubmission } from '../hooks/useEventSubmission'; 
import { EventFormData, BjjEventType, BjjEventDto, GetBjjEventsPaginationQuery } from '../types/event';
import LoadingState from '../components/Events/EventsPageFeedback/LoadingState';
import ErrorState from '../components/Events/EventsPageFeedback/ErrorState';
import NoEventsState from '../components/Events/EventsPageFeedback/NoEventsState';
import BackgroundFetchingIndicator from '../components/Events/EventsPageFeedback/BackgroundFetchingIndicator';
import EventsPageHeader from '../components/Events/EventsPageHeader';
import EventsList from '../components/Events/EventsList';

const DEFAULT_PAGE_SIZE = 12;

const EventsPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<GetBjjEventsPaginationQuery>({
    city: 'all',
    type: undefined,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const {
    data: paginatedData,
    pagination,
    isLoading,
    isFetching,
    error,
    currentPage,
    handlePageChange,
    updateFilters,
    refetch,
  } = usePaginatedQuery<BjjEventDto, GetBjjEventsPaginationQuery>({
    queryKeyBase: ['bjjEvents'],
    fetchFn: getBjjEvents,
    initialParams: activeFilters,
  });

  const { mutate: submitEvent, isPending: isSubmittingEvent } = useEventSubmission();

  const scrollToTop = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleFilterChange = useCallback(
    (key: keyof Omit<GetBjjEventsPaginationQuery, 'page' | 'pageSize'>, value: City | BjjEventType | 'all' | undefined) => {
      const newFilterUpdate: Partial<GetBjjEventsPaginationQuery> = { page: 1 }; // Reset to page 1 on filter change
      if (key === 'city') {
        newFilterUpdate.city = value as City | 'all';
      } else if (key === 'type') {
        newFilterUpdate.type = value === 'all' ? undefined : (value as BjjEventType | undefined);
      }
      setActiveFilters((prev) => ({ ...prev, ...newFilterUpdate }));
      updateFilters(newFilterUpdate);
      scrollToTop();
    },
    [updateFilters, scrollToTop]
  );

  const onPageChange = useCallback(
    (url: string | null, page?: number) => {
      handlePageChange(url, page); // This should internally update 'page' in usePaginatedQuery
      // Update activeFilters if necessary, though usePaginatedQuery should handle current page.
      if (page) {
          setActiveFilters(prev => ({...prev, page}));
      }
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
            //TODO: Handle toast message
            //toast.success('Event submitted successfully for review!');

            updateFilters({}); // Refreshes events with current filters (including current page)
            resolve();
          },
          onError: (submissionError) => {
            console.error('Event submission failed:', submissionError);
            // Consider user-facing notification for submission error (e.g., toast)
            reject(submissionError);
          },
        });
      }),
    [submitEvent, updateFilters]
  );

  const handleRetryFetch = useCallback(() => {
    if (refetch) {
      refetch();
    } else {
      // Fallback if refetch is not available from the hook
      updateFilters(activeFilters);
    }
  }, [refetch, updateFilters, activeFilters]);

  const events = useMemo(() => paginatedData ?? [], [paginatedData]);

  const isInitialLoading = isLoading && events.length === 0;
  const isBackgroundFetching = isFetching && !isLoading;
  const hasError = !!error;
  const noEventsFound = !isInitialLoading && !hasError && events.length === 0 && !isFetching;

  const errorMessage = useMemo(() => {
    if (!error) return '';
    return error.message?.includes('failed to fetch')
      ? 'Could not connect to the server. Please check your internet connection and try again.'
      : error.message || 'An unexpected error occurred while loading events. Please try again.';
  }, [error]);

  const renderMainContent = () => {
    if (isInitialLoading) return <LoadingState />;
    if (hasError) return <ErrorState message={errorMessage} onRetry={handleRetryFetch} />;
    if (noEventsFound) return <NoEventsState onOpenForm={() => setIsFormOpen(true)} />;
    if (events.length > 0) return <EventsList events={events} />;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8  sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <EventsPageHeader
          onOpenForm={() => setIsFormOpen(true)}
          isSubmittingEvent={isSubmittingEvent}
          isFormOpen={isFormOpen}
        />

        <div className="mb-8">
          <EventFilters
            selectedCity={activeFilters.city}
            selectedType={activeFilters.type}
            onCityChange={(city) => handleFilterChange('city', city)}
            onTypeChange={(type) => handleFilterChange('type', type)}
            disabled={isFetching || isLoading}
          />
        </div>

        <main className="relative" aria-live="polite" aria-busy={isFetching}>
          {isBackgroundFetching && events.length > 0 && <BackgroundFetchingIndicator />}
          {renderMainContent()}
        </main>

        {pagination && pagination.totalPages > 1 && !hasError && events.length > 0 && (
          <div className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-700">
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
            // Consider passing initialFocusRef to EventForm for accessibility
          />
        )}
      </div>
    </div>
  );
};

export default memo(EventsPage);