import React, { memo } from 'react';
import { GymDto } from '../../types/gyms';
import { GymCard } from './GymCard';
import { GymsListTestIds } from '../../constants/gymDataTestIds';

interface GymsListProps {
  gyms?: GymDto[];
  isLoading?: boolean;
  error?: unknown;
  'data-testid'?: string;
  testIdInstanceSuffix?: string;
}

export const GymsList: React.FC<GymsListProps> = memo(
  ({
    gyms,
    isLoading,
    error,
    'data-testid': dataTestId,
    testIdInstanceSuffix = '',
  }) => {
    const rootListTestId = dataTestId || GymsListTestIds.ROOT(testIdInstanceSuffix);

    if (isLoading) {
      return (
        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"
          data-testid={GymsListTestIds.LOADING(testIdInstanceSuffix)}
        >
        </div>
      );
    }

    if (error) {
      return (
        <div
          className="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          data-testid={GymsListTestIds.ERROR(testIdInstanceSuffix)}
        >
          <p className="font-medium">Could not load gyms.</p>
        </div>
      );
    }

    if (!gyms || gyms.length === 0) {
      return (
        <div
          className="text-center py-12 text-slate-500 dark:text-slate-400"
          data-testid={GymsListTestIds.EMPTY(testIdInstanceSuffix)}
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
          const gymCardRootId = GymsListTestIds.ITEM(gym.id || gym.name.replace(/\s+/g, '-').toLowerCase());

          return (
            <GymCard
              key={gym.id || gym.name}
              gym={gym}
              data-testid={gymCardRootId}
              //testIdInstanceSuffix={gymCardInstanceSuffix}
            />
          );
        })}
      </div>
    );
  }
);