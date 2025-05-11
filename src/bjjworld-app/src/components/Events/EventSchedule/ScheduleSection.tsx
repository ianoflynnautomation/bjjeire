import React from 'react'

interface ScheduleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ title, icon, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-x-2">
      <span className="h-5 w-5 text-slate-400" aria-hidden="true">
        {icon}
      </span>
      <h4 className="font-semibold text-slate-600">{title}</h4>
    </div>
    {children}
  </div>
)
