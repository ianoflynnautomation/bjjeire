import type { JSX } from 'react'
import { TricolorEdge } from '@/components/ui/decoration/tricolor-edge'

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
      className="relative mb-8 overflow-hidden rounded-xl bg-surface-solid px-5 py-6 ring-1 ring-hairline sm:px-7"
      data-testid={testIds.root}
    >
      <TricolorEdge />
      <div className="relative">
        <h2
          className="display-expanded text-3xl font-bold text-fg sm:text-4xl"
          data-testid={testIds.title}
        >
          {title}
        </h2>
        {showTotal && totalLabel && (
          <p
            className="mt-3 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-fg-muted ring-1 ring-hairline"
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
