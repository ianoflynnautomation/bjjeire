import React from 'react'

interface ScheduleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  'data-testid'?: string
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  title,
  icon,
  children,
  'data-testid': dataTestId,
}) => (
  <div className="space-y-3" data-testid={dataTestId}>
    <div className="flex items-center gap-x-2">
      <span className="h-5 w-5 text-slate-400" aria-hidden="true">
        {icon}
      </span>
      <h4
        className="font-semibold text-slate-700 "
        data-testid={dataTestId ? `${dataTestId}-title` : undefined}
      >
        {title}
      </h4>
    </div>
    {children}
  </div>
)
