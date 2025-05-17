import React, { useCallback, useState, memo, useMemo } from 'react';
import { useBjjEvents } from '../api/get-bjj-events';
import { County } from '../constants/counties';
import { GetBjjEventsPaginationQuery, BjjEventType } from '../types/event';
import EventFilters from '../components/Events/EventFilters/EventFilters';
import Pagination from '../components/Pagination';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import NoDataState from '../components/common/NoDataState';
import BackgroundFetchingIndicator from '../components/common/BackgroundFetchingIndicator';
import EventsPageHeader from '../components/Events/EventsPageHeader';
import EventsList from '../components/Events/EventsList';
import { env } from '../config/env'

const EventsPage: React.FC = () => {
  const [activeFilters, setActiveFilters] = useState<GetBjjEventsPaginationQuery>({
    county: 'all',
    type: undefined,
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
  });

  const {
    data: bjjEventsResponse,
    isLoading,
    isFetching,
    error: fetchError,
    refetch,
  } = useBjjEvents({
    county: activeFilters.county,
    type: activeFilters.type,
    page: activeFilters.page,
    pageSize: activeFilters.pageSize,
  });

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
          newFilters.county = value as County | 'all' | undefined;
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

  const renderMainContent = () => {
    if (isInitialLoading) return <LoadingState />;
    if (hasFetchError) return <ErrorState message={fetchErrorMessage} onRetry={handleRetryFetch} />;
    if (noEventsFound) return (
      <NoDataState
        title="No Events Found"
        messageLine1="No events match your current filters."
        messageLine2="Try a different filter to find events."
      />
    );
    if (events.length > 0) return <EventsList events={events} />;
    return null;
  };

  return (
    <div className="min-h-screen dark:bg-slate-900 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <EventsPageHeader />

        <div className="mb-8">
          <EventFilters
            selectedCity={activeFilters.county}
            selectedType={activeFilters.type}
            onCityChange={(city) => handleFilterChange('county', city)}
            onTypeChange={(type) => handleFilterChange('type', type)}
            disabled={isFetching || isLoading}
          />
        </div>

        <main className="relative" aria-live="polite" aria-busy={isFetching}>
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
      </div>
    </div>
  );
};

export default memo(EventsPage);