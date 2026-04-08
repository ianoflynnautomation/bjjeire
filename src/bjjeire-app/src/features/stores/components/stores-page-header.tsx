import { memo } from 'react'
import type { JSX } from 'react'
import { StoresPageTestIds } from '@/constants/storeDataTestIds'
import { uiContent } from '@/config/ui-content'

const { pageTitle } = uiContent.stores

interface StoresPageHeaderProps {
  totalStores?: number
  'data-testid'?: string
}

export const StoresPageHeader = memo(function StoresPageHeader({
  totalStores,
  'data-testid': baseTestId = StoresPageTestIds.HEADER,
}: StoresPageHeaderProps): JSX.Element {
  const suffix =
    totalStores === 1
      ? pageTitle.foundSuffixSingular
      : pageTitle.foundSuffixPlural
  const totalLabel =
    totalStores === undefined
      ? ''
      : `${pageTitle.foundPrefix} ${totalStores} ${suffix}`

  return (
    <header
      className="relative mb-8 overflow-hidden rounded-3xl bg-white/80 px-5 py-6 backdrop-blur-sm ring-1 ring-black/8 sm:px-7 dark:bg-slate-800/40 dark:ring-white/8"
      data-testid={baseTestId}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-emerald-500 via-white/30 to-orange-500"
        aria-hidden="true"
      />
      <div
        className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-teal-500/10 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-8 left-10 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative">
        <h2
          className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white"
          data-testid={StoresPageTestIds.HEADER_TITLE}
        >
          {pageTitle.all}
        </h2>
        {totalStores !== undefined && totalStores > 0 && (
          <p
            className="mt-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-900/40 dark:text-emerald-300"
            data-testid={StoresPageTestIds.HEADER_TOTAL}
            aria-live="polite"
          >
            {totalLabel}
          </p>
        )}
      </div>
    </header>
  )
})
