import type { ReactNode } from 'react'
import type React from 'react'

interface PageLayoutProps {
  children: ReactNode
}

export default function PageLayout({
  children,
}: Readonly<PageLayoutProps>): React.JSX.Element {
  return (
    <div className="min-h-screen py-4 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  )
}
