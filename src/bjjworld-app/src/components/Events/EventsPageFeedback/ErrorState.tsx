import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div
    role="alert"
    className="my-10 rounded-md border border-orange-200 bg-orange-50 p-6 text-center shadow-sm"
  >
    <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-orange-500" aria-hidden="true" />
    <h3 className="mt-2 text-lg font-semibold text-slate-800">Error Loading Events</h3>
    <p className="mt-1 text-sm text-slate-600">{message}</p>
    <button
      onClick={onRetry}
      className="mt-4 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shadow-sm transition-colors"
    >
      Retry
    </button>
  </div>
);

export default React.memo(ErrorState);