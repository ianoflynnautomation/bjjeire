import React, { memo } from 'react'
import { GymsPageTestIds } from '../../../constants/gymDataTestIds'

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
        ? 'All BJJ Gyms'
        : `BJJ Gyms in ${countyName}`

    return (
      <header
        className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
        data-testid={baseTestId}
      >
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl"
            data-testid={GymsPageTestIds.HEADER_TITLE}
          >
            {title}
          </h1>
          {totalGyms !== undefined && totalGyms > 0 && (
            <p
              className="mt-1 text-sm text-slate-600 dark:text-slate-50"
              data-testid={GymsPageTestIds.HEADER_TOTAL}
            >
              Found {totalGyms} gym{totalGyms !== 1 ? 's' : ''}.
            </p>
          )}
        </div>
      </header>
    )
  }
)
