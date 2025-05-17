import React from 'react';

interface GymCardSkeletonsProps {
  count?: number;
  'data-testid'?: string;
}

const GymCardSkeleton: React.FC<{ 'data-testid'?: string }> = ({ 'data-testid': dataTestId }) => (
  <div
    data-testid={dataTestId}
    className="h-full rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg p-5 animate-pulse"
  >
    <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-t-md mb-4"></div>
    <div className="space-y-3">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
    </div>
  </div>
);

export const GymCardSkeletons: React.FC<GymCardSkeletonsProps> = ({
  count = 8,
  'data-testid': baseTestId = 'gym-card-skeletons',
}) => (
  <div
    className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
    data-testid={baseTestId}
  >
    {Array.from({ length: count }).map((_, index) => (
      <GymCardSkeleton
        key={`skeleton-${index}`}
        data-testid={`${baseTestId}-${index}`}
      />
    ))}
  </div>
);

export default React.memo(GymCardSkeletons);