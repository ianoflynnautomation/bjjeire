import React, { useState, useMemo } from 'react';
import { useGyms } from '../api/get-gyms';
import { GymsList } from '../components/Gyms/GymsList';
import { GymsPageHeader } from '../components/Gyms/GymsPageHeader';
import  SelectFilter from '../components/Filters/SelectFilter'; // Assuming you want county filter
// import { PaginationControls } from '../../components/common/PaginationControls/PaginationControls'; // You'll need to create this

// Mock counties for the filter example - replace with actual data source
const irishCounties = [
  { value: 'Antrim', label: 'Antrim' }, { value: 'Armagh', label: 'Armagh' },
  { value: 'Carlow', label: 'Carlow' }, { value: 'Cavan', label: 'Cavan' },
  { value: 'Clare', label: 'Clare' }, { value: 'Cork', label: 'Cork' },
  { value: 'Derry', label: 'Derry' }, { value: 'Donegal', label: 'Donegal' },
  { value: 'Down', label: 'Down' }, { value: 'Dublin', label: 'Dublin' },
  { value: 'Fermanagh', label: 'Fermanagh' }, { value: 'Galway', label: 'Galway' },
  { value: 'Kerry', label: 'Kerry' }, { value: 'Kildare', label: 'Kildare' },
  { value: 'Kilkenny', label: 'Kilkenny' }, { value: 'Laois', label: 'Laois' },
  { value: 'Leitrim', label: 'Leitrim' }, { value: 'Limerick', label: 'Limerick' },
  { value: 'Longford', label: 'Longford' }, { value: 'Louth', label: 'Louth' },
  { value: 'Mayo', label: 'Mayo' }, { value: 'Meath', label: 'Meath' },
  { value: 'Monaghan', label: 'Monaghan' }, { value: 'Offaly', label: 'Offaly' },
  { value: 'Roscommon', label: 'Roscommon' }, { value: 'Sligo', label: 'Sligo' },
  { value: 'Tipperary', label: 'Tipperary' }, { value: 'Tyrone', label: 'Tyrone' },
  { value: 'Waterford', label: 'Waterford' }, { value: 'Westmeath', label: 'Westmeath' },
  { value: 'Wexford', label: 'Wexford' }, { value: 'Wicklow', label: 'Wicklow' },
];


// Simple Pagination Controls (You might want a more robust component)
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage, totalPages, onPageChange, hasNextPage, hasPreviousPage
}) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  // Example: Show current page, +/- 2 pages, and first/last
  const wingSize = 2;
  let startPage = Math.max(1, currentPage - wingSize);
  let endPage = Math.min(totalPages, currentPage + wingSize);

  if (currentPage - wingSize <= 1) {
    endPage = Math.min(totalPages, 1 + wingSize * 2);
  }
  if (currentPage + wingSize >= totalPages) {
    startPage = Math.max(1, totalPages - wingSize * 2);
  }


  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        Previous
      </button>

      {startPage > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">1</button>
          {startPage > 2 && <span className="text-slate-500 dark:text-slate-400">...</span>}
        </>
      )}

      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
            currentPage === number
              ? 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-600'
              : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          {number}
        </button>
      ))}

      {endPage < totalPages && (
         <>
          {endPage < totalPages -1 && <span className="text-slate-500 dark:text-slate-400">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">{totalPages}</button>
        </>
      )}


      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        Next
      </button>
    </nav>
  );
};


export const GymsPage: React.FC = () => {
  const [selectedCounty, setSelectedCounty] = useState<string>('Dublin'); // Default or from URL
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12; // Or from config

  const { data: paginatedGyms, isLoading, error, isPlaceholderData } = useGyms({
    county: selectedCounty,
    page: currentPage,
    pageSize: pageSize,
    queryConfig: {
        // keepPreviousData: true, // TanStack Query v5 uses placeholderData
        placeholderData: (previousData) => previousData, // For smoother pagination
    }
  });

  const handleCountyChange = (countyValue: string | 'all') => {
    setSelectedCounty(countyValue === 'all' ? 'Dublin' : countyValue); // Assuming 'all' isn't a valid API county, default to Dublin or make API handle 'all'
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage && !isPlaceholderData) {
        setCurrentPage(newPage);
        // Optionally scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const countyLabel = useMemo(() => {
    return irishCounties.find(c => c.value === selectedCounty)?.label || selectedCounty;
  }, [selectedCounty]);


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
      <GymsPageHeader countyName={countyLabel} totalGyms={paginatedGyms?.pagination?.totalItems} />

      <div className="mb-8 max-w-xs"> {/* Filter section */}
        <SelectFilter
            id="county-filter"
            label="Select County"
            value={selectedCounty}
            onChange={handleCountyChange}
            options={irishCounties}
            placeholderOptionLabel="All Counties" // This will pass "all"
            // Icon component can be customized or removed
        />
      </div>

      <GymsList
        gyms={paginatedGyms?.data}
        isLoading={isLoading} //&& !paginatedGyms?.data} // Show skeleton only on initial load without data
        error={error}
      />

      {paginatedGyms?.pagination && paginatedGyms.pagination.totalPages > 1 && (
        <PaginationControls
          currentPage={paginatedGyms.pagination.currentPage}
          totalPages={paginatedGyms.pagination.totalPages}
          onPageChange={handlePageChange}
          hasNextPage={paginatedGyms.pagination.hasNextPage}
          hasPreviousPage={paginatedGyms.pagination.hasPreviousPage}
        />
      )}
    </div>
  );
};

// Export for routing
// File: src/features/gyms/index.ts
// export { GymsPage } from './GymsPage';