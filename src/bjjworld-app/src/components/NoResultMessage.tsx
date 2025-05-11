import { memo } from 'react';

interface NoResultsProps {
  city: string;
}

function NoResults({ city }: NoResultsProps) {
  return (
    <div className="text-center p-8 text-slate-600 bg-emerald-50 rounded-md shadow-sm text-lg">
      No gyms found in {city}.
    </div>
  );
}

export default memo(NoResults);