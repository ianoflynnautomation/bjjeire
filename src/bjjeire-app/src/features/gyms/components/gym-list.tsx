import React, { memo } from 'react';
import { GymDto } from '../../../types/gyms';
import { GymCard } from './gym-card';
import { GymsPageTestIds } from '../../../constants/gymDataTestIds';
import { LoadingStateTestIds, StateTestIds, NoDataStateTestIds } from '../../../constants/commonDataTestIds';


interface GymsListProps {
  gyms?: GymDto[];
  isLoading?: boolean;
  error?: unknown;
  'data-testid'?: string;
}

export const GymsList: React.FC<GymsListProps> = memo(
  ({
    gyms,
    isLoading,
    error,
    'data-testid': dataTestId
  }) => {
    const rootListTestId = dataTestId || GymsPageTestIds.LIST;

    if (isLoading) {
      return (
        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"
          data-testid={LoadingStateTestIds.ROOT}
        >
        </div>
      );
    }

    if (error) {
      return (
        <div
          className="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          data-testid={StateTestIds.ROOT}
        >
          <p className="font-medium">Could not load gyms.</p>
        </div>
      );
    }

    if (!gyms || gyms.length === 0) {
      return (
        <div
          className="text-center py-12 text-slate-500 dark:text-slate-400"
          data-testid={NoDataStateTestIds.ROOT}
        >
          <p className="text-xl font-semibold">No gyms found.</p>
          <p>Try adjusting your search or check back later.</p>
        </div>
      );
    }

    return (
      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"
        data-testid={rootListTestId}
      >
        {gyms.map(gym => {
          return (
            <GymCard
              key={gym.id || gym.name}
              gym={gym}
              data-testid={GymsPageTestIds.LIST_ITEM}
            />
          );
        })}
      </div>
    );
  }
);