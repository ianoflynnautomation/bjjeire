import React from 'react'

interface ScheduleItemProps {
  children: React.ReactNode
  className?: string
  'data-testid'?: string
}

export const ScheduleItem: React.FC<ScheduleItemProps> = ({
  children,
  className,
  'data-testid': dataTestId,
}) => (
  <li className={`text-slate-600  ${className || ''}`} data-testid={dataTestId}>
    {children}
  </li>
)
