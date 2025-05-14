// src/components/Schedule/ScheduleItem.tsx
import React from 'react';

interface ScheduleItemProps {
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const ScheduleItem: React.FC<ScheduleItemProps> = ({
  children,
  className = '',
  'data-testid': dataTestId,
}) => (
  // Using flex here to allow children to manage their own layout better
  <li className={`text-sm ${className}`} data-testid={dataTestId}>
    {children}
  </li>
);