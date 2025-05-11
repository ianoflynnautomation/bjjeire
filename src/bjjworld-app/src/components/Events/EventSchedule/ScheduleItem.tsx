import React from 'react'

interface ScheduleItemProps {
  children: React.ReactNode
  className?: string
}

export const ScheduleItem: React.FC<ScheduleItemProps> = ({ children, className }) => (
  <li className={`text-slate-600 ${className || ''}`}>{children}</li>
)
