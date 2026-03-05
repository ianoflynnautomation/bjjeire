import React, { memo } from 'react'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'

const { pageTitle } = uiContent.gyms

interface GymsPageHeaderProps {
  countyName?: string
  totalGyms?: number
  'data-testid'?: string
}

export const GymsPageHeader: React.FC<GymsPageHeaderProps> = memo(
  ({
    countyName,
    totalGyms,
    'data-testid': baseTestId = GymsPageTestIds.HEADER,
  }) => {
    const title =
      !countyName || countyName.toLowerCase() === 'all'
        ? pageTitle.all
        : `${pageTitle.prefix} ${countyName}`
    const totalGymsLabel =
      totalGyms !== undefined
        ? `Found ${totalGyms} gym${totalGyms !== 1 ? 's' : ''}.`
        : ''

    return (
      <header
        className="relative mb-8 overflow-hidden rounded-3xl bg-slate-800/40 px-5 py-6 backdrop-blur-sm ring-1 ring-white/[0.08] sm:px-7"
        data-testid={baseTestId}
      >
        {/* Subtle Irish tricolor top accent */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-white/30 to-orange-500" aria-hidden="true" />
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-teal-500/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-8 left-10 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" aria-hidden="true" />
        <div className="relative">
          <h1
            className="text-3xl font-black tracking-tight text-white sm:text-4xl"
            data-testid={GymsPageTestIds.HEADER_TITLE}
          >
            {title}
          </h1>
          {totalGyms !== undefined && totalGyms > 0 && (
            <p
              className="mt-3 inline-flex items-center rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30"
              data-testid={GymsPageTestIds.HEADER_TOTAL}
              aria-live="polite"
            >
              {totalGymsLabel}
            </p>
          )}
        </div>
      </header>
    )
  }
)
