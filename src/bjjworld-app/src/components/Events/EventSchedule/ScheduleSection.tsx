// src/components/Schedule/ScheduleSection.tsx
import React from 'react';

interface ScheduleSectionProps {
  title: string;
  icon: React.ReactNode; // Expecting icon component, e.g., <CalendarDaysIcon />
  children: React.ReactNode;
  'data-testid'?: string;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  title,
  icon,
  children,
  'data-testid': dataTestId,
}) => (
  <div
    className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60" // p-4 still applies
    data-testid={dataTestId}
  >
    <div className="mb-3 flex items-center gap-x-2">
      <span className="h-5 w-5 flex-shrink-0 text-orange-500 dark:text-orange-400" aria-hidden="true">
        {icon}
      </span>
      <h3
        className="text-base font-semibold text-slate-800 dark:text-slate-100"
        data-testid={dataTestId ? `${dataTestId}-title` : undefined}
      >
        {title}
      </h3>
    </div>
    {/* Reduced indentation from pl-7 to pl-6 */}
    <div className="space-y-2 pl-6"> {/* w-5 icon (1.25rem) + gap-x-2 (0.5rem) = 1.75rem. pl-6 (1.5rem) means content starts slightly before title text ends.
                                       This is a trade-off. For perfect alignment with text, it would be pl-7.
                                       Let's prioritize width for content as requested.
                                    */}
      {children}
    </div>
  </div>
);