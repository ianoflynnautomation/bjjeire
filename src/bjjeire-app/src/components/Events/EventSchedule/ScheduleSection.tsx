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
  <div
    className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60"
    data-testid={dataTestId}
  >
    <div className="mb-3 flex items-center gap-x-2">
      <span
        className="h-5 w-5 flex-shrink-0 text-orange-500 dark:text-orange-400"
        aria-hidden="true"
      >
        {icon}
      </span>
      <h3
        className="text-base font-semibold text-slate-800 dark:text-slate-100"
        data-testid={dataTestId ? `${dataTestId}-title` : undefined}
      >
        {title}
      </h3>
    </div>
    <div className="space-y-2 pl-6">{children}</div>
  </div>
)
