import { memo } from 'react'
import type { ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
}

const PageLayout = memo(function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen py-4 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  )
})

export default PageLayout
