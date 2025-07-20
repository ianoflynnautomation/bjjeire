import React, { memo } from 'react'
import { GymDto } from '../../../../types/gyms'
import { GymHeader, GymDetails, GymFooter } from '.'
import { GymsPageTestIds } from '../../../../constants/gymDataTestIds'

interface GymCardProps {
  gym: GymDto
  'data-testid'?: string
}

export const GymCard: React.FC<GymCardProps> = memo(
  ({ gym, 'data-testid': dataTestId }) => {
    const { name, county, status, imageUrl, website } = gym

    const rootTestId = dataTestId || GymsPageTestIds.LIST_ITEM

    return (
      <article
        data-testid={rootTestId}
        className="
          flex h-full flex-col rounded-lg
          bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-800
          shadow-lg transition-all duration-300 ease-in-out
          hover:shadow-emerald-200/50 dark:hover:shadow-emerald-700/30 hover:-translate-y-1
          overflow-hidden group"
      >
        <GymHeader
          name={name}
          county={county}
          status={status}
          imageUrl={imageUrl}
        />

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="mb-4">
            <GymDetails
              gym={gym}
            />
          </div>
          <div className="flex-grow" />
          <GymFooter
            websiteUrl={website}
            gymName={name}
          />
        </div>
      </article>
    )
  }
)
