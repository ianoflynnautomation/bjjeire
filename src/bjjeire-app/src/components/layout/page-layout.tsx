import React, { ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  )
}

export default PageLayout
