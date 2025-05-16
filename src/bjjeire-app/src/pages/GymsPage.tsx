import React, { useState, memo,useMemo } from 'react';
import { useGyms } from '../api/get-gyms';
import { COUNTIES } from '../constants/counties';
import { GymsList } from '../components/Gyms/GymsList';
import { GymsPageHeader } from '../components/Gyms/GymsPageHeader';
import SelectFilter from '../components/Filters/SelectFilter';
import Pagination from '../components/Pagination'; // Import the Pagination component

export const GymsPage: React.FC = () => {
  const [selectedCounty, setSelectedCounty] = useState<string | 'all' | undefined>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { data: paginatedGyms, isLoading, error } = useGyms({
    county: selectedCounty === 'all' ? undefined : selectedCounty,
    page: currentPage,
    pageSize: pageSize,
    queryConfig: {
      placeholderData: (previousData) => previousData,
    },
  });

  const handleCountyChange = (countyValue: string | 'all' | undefined) => {
    setSelectedCounty(countyValue === 'all' ? 'all' : countyValue);
    setCurrentPage(1); // Reset to first page on filter change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (url: string | null, page?: number) => {
    if ((page && page !== currentPage) || url) {
      setCurrentPage(page || currentPage); // Use page if provided, else keep current
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const countyLabel = useMemo(() => {
    return COUNTIES.find(c => c.value === selectedCounty)?.label || selectedCounty || 'All Counties';
  }, [selectedCounty]);

  return (
    <div className="min-h-screen dark:bg-slate-900 sm:py-12">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <GymsPageHeader countyName={countyLabel} totalGyms={paginatedGyms?.pagination?.totalItems} />

      <div className="mb-8">
        <SelectFilter
          id="county-filter"
          label="Select County"
          value={selectedCounty}
          onChange={handleCountyChange}
          options={COUNTIES}
          placeholderOptionLabel="All Counties"
        />
      </div>

      <GymsList
        gyms={paginatedGyms?.data}
        isLoading={isLoading}
        error={error}
      />

      {paginatedGyms?.pagination && paginatedGyms.pagination.totalPages > 1 && (
        <div className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-700">
          <Pagination
            currentPage={paginatedGyms.pagination.currentPage}
            pagination={paginatedGyms.pagination}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
    </div>
  );
};

export default memo(GymsPage);