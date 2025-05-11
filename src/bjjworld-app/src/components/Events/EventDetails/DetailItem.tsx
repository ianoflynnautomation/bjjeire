import React, { memo } from 'react';

interface DetailItemProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export const DetailItem: React.FC<DetailItemProps> = memo(
  ({ icon, children, className, ariaLabel }) => (
    <div
      className={`flex items-start gap-x-2 text-slate-600 ${className || ''}`}
    >
      <span
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="flex-grow" {...(ariaLabel && { 'aria-label': ariaLabel })}>
        {children}
      </div>
    </div>
  )
);