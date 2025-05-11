import React from 'react';

const BackgroundFetchingIndicator: React.FC = () => (
  <div
    className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 transform rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm"
    role="status"
    aria-live="polite"
  >
    Updating...
  </div>
);

export default React.memo(BackgroundFetchingIndicator);