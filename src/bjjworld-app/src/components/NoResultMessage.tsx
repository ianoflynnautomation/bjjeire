import { memo } from 'react';

interface NoResultsProps {
  city: string;
}

function NoResults({ city }: NoResultsProps) {
  return (
    <div className="text-center p-8 text-gray-600 bg-gray-50 rounded text-lg shadow-sm">
      No gyms found in {city}.
    </div>
  );
}

export default memo(NoResults);