import React from 'react';
import LoadingSpinner from '../../LoadingSpinner';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading events...' }) => (
  <div className="flex w-full justify-center rounded-md bg-emerald-50 p-10 shadow-sm">
    <LoadingSpinner color="text-emerald-600" text={message} size="lg" />
  </div>
);

export default React.memo(LoadingState);