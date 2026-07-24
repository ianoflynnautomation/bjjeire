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
      className="relative mb-8 overflow-hidden rounded-3xl bg-white/80 px-5 py-6 backdrop-blur-sm ring-1 ring-black/8 sm:px-7 dark:bg-slate-800/40 dark:ring-white/8"
      data-testid={testIds.root}
    >
      <TricolorEdge />
      <GlowField />
      <div className="relative">
        <h2
          className="display-expanded text-3xl font-black text-slate-900 sm:text-4xl dark:text-white"
          data-testid={testIds.title}
        >
          {title}
        </h2>
        {showTotal && totalLabel && (
          <p
            className="mt-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-900/40 dark:text-emerald-300"
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
