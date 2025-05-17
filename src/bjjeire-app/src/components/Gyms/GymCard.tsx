import React, { memo } from 'react'
import { GymDto } from '../../types/gyms'
import { GymHeader } from './GymHeader'
import { GymDetails } from './GymDetails'
import { GymFooter } from './GymFooter'

interface GymCardProps {
  gym: GymDto
  'data-testid'?: string
}

export const GymCard: React.FC<GymCardProps> = memo(
  ({ gym, 'data-testid': dataTestId }) => {
    const { name, county, status, imageUrl, website } = gym

    return (
      <article
        data-testid={dataTestId || `gym-card-${gym.id || name}`}
        className="
        flex h-full flex-col rounded-lg
        bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-800
        shadow-lg transition-all duration-300 ease-in-out
        hover:shadow-emerald-200/50 dark:hover:shadow-emerald-700/30 hover:-translate-y-1
        overflow-hidden group"
      >
        {/* Gym Header Section */}
        <GymHeader
          name={name}
          county={county}
          status={status}
          imageUrl={imageUrl}
        />

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {' '}
          {/* Content padding */}
          {/* Gym Details Section */}
          <div className="mb-4">
            {' '}
            {/* Added margin-bottom */}
            <GymDetails gym={gym} />
          </div>
          {/* Spacer to push footer down */}
          <div className="flex-grow" />
          {/* Gym Footer Section */}
          {website && ( // Conditionally render footer
            <GymFooter websiteUrl={website} gymName={name} />
          )}
        </div>
      </article>
    )
  }
)
