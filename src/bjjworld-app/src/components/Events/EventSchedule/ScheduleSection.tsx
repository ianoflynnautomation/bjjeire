// src/components/Schedule/ScheduleSection.tsx
import React from 'react';

interface ScheduleSectionProps {
  title: string;
  icon: React.ReactNode; 
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
    className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60" // Subtle bg for grouping
    data-testid={dataTestId}
  >
    <div className="mb-3 flex items-center gap-x-2.5"> {/* Consistent gap */}
      <span className="h-5 w-5 flex-shrink-0 text-orange-500 dark:text-orange-400" aria-hidden="true"> {/* Icon color set here */}
        {icon} {/* Pass the icon component itself, e.g., <CalendarDaysIcon /> */}
      </span>
      <h3
        className="text-base font-semibold text-slate-800 dark:text-slate-100" // Slightly smaller title if it's within a card
        data-testid={dataTestId ? `${dataTestId}-title` : undefined}
      >
        {title}
      </h3>
    </div>
    {/* Content area: Children will be rendered here directly */}
    {/* The pl for children will be handled by individual child components if needed or globally for text */}
    <div className="space-y-2 pl-[calc(theme(spacing.5)_+_theme(spacing[2.5]))]"> 
      {/* Indent content to align with title text: icon width (w-5 = 1.25rem) + gap-x-2.5 (0.625rem) = 1.875rem. This is pl-7.5, so pl-7 or pl-8.
          Let's use h-5/w-5 (1.25rem) and gap-x-2 (0.5rem) -> 1.75rem (pl-7) for precise alignment.
          Adjusting gap to gap-x-2 above. Icon h-5 w-5.
      */}
      {children}
    </div>
  </div>
);