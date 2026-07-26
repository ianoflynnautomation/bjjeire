import type { JSX } from 'react'
import { TricolorEdge } from '@/components/ui/decoration/tricolor-edge'
import { GlowField } from '@/components/ui/decoration/glow-field'

export interface ListPageHeaderTestIds {
  root: string
  title: string
  total: string
}

interface ListPageHeaderProps {
  title: string
  totalLabel?: string
  showTotal?: boolean
  testIds: ListPageHeaderTestIds
}

export const ListPageHeader = function ListPageHeader({
  title,
  totalLabel,
  showTotal = false,
  testIds,
}: ListPageHeaderProps): JSX.Element {
  return (
    <header
      className="relative mb-8 overflow-hidden rounded-3xl bg-surface px-5 py-6 backdrop-blur-sm ring-1 ring-hairline sm:px-7"
      data-testid={testIds.root}
    >
      <TricolorEdge />
      <GlowField />
      <div className="relative">
        <h2
          className="display-expanded text-3xl font-black text-fg sm:text-4xl"
          data-testid={testIds.title}
        >
          {title}
        </h2>
        {showTotal && totalLabel && (
          <p
            className="mt-3 inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 ring-1 ring-primary-500/30 dark:bg-primary-900/40 dark:text-primary-300"
            data-testid={testIds.total}
            aria-live="polite"
          >
            {totalLabel}
          </p>
        )}
      </div>
    </header>
  )
}
