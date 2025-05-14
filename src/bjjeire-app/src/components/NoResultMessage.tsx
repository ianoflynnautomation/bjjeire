import { memo } from 'react';

interface NoResultsProps {
  city: string;
}

function NoResults({ city }: NoResultsProps) {
  const displayCity = city || 'the specified location';

  return (
    <div
      data-testid="no-results" 
      className="text-center p-8 text-slate-600 bg-emerald-50 rounded-md shadow-sm text-lg"
    >
      <span data-testid="no-results-message">
        No gyms found in {displayCity}.
      </span>
    </div>
  );
}

export default memo(NoResults);