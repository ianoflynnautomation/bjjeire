import React from 'react';
import clsx from 'clsx';

interface IconWrapperProps {
  children: React.ReactNode;
  className?: string;
  'aria-hidden'?: boolean;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({
  children,
  className = 'h-5 w-5 text-emerald-600 dark:text-emerald-400', // Default styling
  'aria-hidden': ariaHidden = true,
}) => {
  return (
    <span
      className={clsx('mt-0.5 flex-shrink-0', className)}
      aria-hidden={ariaHidden}
    >
      {children}
    </span>
  );
};