import React, { memo } from 'react';
import { IconWrapper } from './IconWrapper'; // Import IconWrapper

interface DetailItemProps {
  icon: React.ReactNode; // Icon component itself, e.g., <MapPinIcon />
  children: React.ReactNode;
  className?: string;
  iconClassName?: string; // To customize icon styling if needed
  ariaLabel?: string;
  'data-testid'?: string;
}

export const DetailItem: React.FC<DetailItemProps> = memo(
  ({ icon, children, className, iconClassName, ariaLabel, 'data-testid': dataTestId }) => (
    <div
      className={`flex items-start gap-x-2.5 text-slate-600 dark:text-slate-300 ${className || ''}`} // Adjusted gap and text color
      data-testid={dataTestId}
    >
      <IconWrapper className={iconClassName}>{icon}</IconWrapper>
      <div
        className="flex-grow"
        {...(ariaLabel && { 'aria-label': ariaLabel })}
      >
        {children}
      </div>
    </div>
  )
);