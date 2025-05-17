import React, { memo } from 'react'
import { GymDto } from '../../types/gyms'
import { GymCard } from './GymCard'

interface GymsListProps {
  gyms?: GymDto[]
  isLoading?: boolean
  error?: unknown
  'data-testid'?: string
}

const GymCardSkeleton: React.FC<{ 'data-testid'?: string }> = ({
  'data-testid': dataTestId,
}) => (
  <div
    data-testid={dataTestId}
    className="h-full rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg p-5 animate-pulse"
  >
    <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-t-md mb-4"></div>
    <div className="space-y-3">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
    </div>
  </div>
)

export const GymsList: React.FC<GymsListProps> = memo(
  ({ gyms, isLoading, error, 'data-testid': baseTestId = 'gyms-list' }) => {
    if (isLoading) {
      return (
        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"
          data-testid={`${baseTestId}-loading`}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <GymCardSkeleton
              key={`skeleton-${index}`}
              data-testid={`<span class="math-inline">{baseTestId}-skeleton-</span>{index}`}
            />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div
          className="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          data-testid={`${baseTestId}-error`}
        >
          <p className="font-medium">Could not load gyms.</p>
        </div>
      )
    }

    if (!gyms || gyms.length === 0) {
      return (
        <div
          className="text-center py-12 text-slate-500 dark:text-slate-400"
          data-testid={`${baseTestId}-empty`}
        >
          <p className="text-xl font-semibold">No gyms found.</p>
          <p>Try adjusting your search or check back later.</p>
        </div>
      )
    }

    return (
      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"
        data-testid={baseTestId}
      >
        {gyms.map(gym => (
          <GymCard
            key={gym.id || gym.name}
            gym={gym}
            data-testid={`<span class="math-inline">{baseTestId}-item-</span>{gym.id || gym.name.replace(/s+/g, '-').toLowerCase()}`}
          />
        ))}
      </div>
    )
  }
)
