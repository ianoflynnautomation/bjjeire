import React, { memo } from 'react';
// import { PlusIcon } from '@heroicons/react/20/solid'; // If adding "Suggest Gym"
// import clsx from 'clsx';

interface GymsPageHeaderProps {
  countyName?: string; // Make it optional for a general gyms page
  totalGyms?: number;
  'data-testid'?: string;
  // onOpenSuggestForm?: () => void;
  // isSuggestFormOpen?: boolean;
}

export const GymsPageHeader: React.FC<GymsPageHeaderProps> = memo(
  ({ countyName, totalGyms, 'data-testid': baseTestId = 'gyms-page-header' }) => {
    const title = countyName ? `BJJ Gyms in ${countyName}` : 'All BJJ Gyms';
    return (
      <header
        className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
        data-testid={baseTestId}
      >
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl"
            data-testid={`${baseTestId}-title`}
          >
            {title}
          </h1>
          {totalGyms !== undefined && totalGyms > 0 && (
             <p className="mt-1 text-sm text-slate-600 dark:text-slate-50 ">
                Found {totalGyms} gym{totalGyms !== 1 ? 's' : ''}.
             </p>
          )}
        </div>
        {/* Example: Suggest Gym Button
        {onOpenSuggestForm && (
          <button
            type="button"
            onClick={onOpenSuggestForm}
            // disabled={isSuggestFormOpen} // Or some other condition
            className={clsx(
              'inline-flex items-center gap-x-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out',
              'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
            aria-expanded={isSuggestFormOpen}
            data-testid={`${baseTestId}-suggest-gym-button`}
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Suggest a Gym
          </button>
        )}
        */}
      </header>
    );
  }
);