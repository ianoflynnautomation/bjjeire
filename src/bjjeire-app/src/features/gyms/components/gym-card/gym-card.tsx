import React, { memo } from 'react'
import type { GymDto } from '@/types/gyms'
import { GymHeader, GymDetails, GymFooter } from '.'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'
import { Card, CardContent } from '@/components/ui/card/card'

interface GymCardProps {
  gym: GymDto
  'data-testid'?: string
}

export const GymCard: React.FC<GymCardProps> = memo(
  ({ gym, 'data-testid': dataTestId }) => {
    const { name, county, status, imageUrl, website } = gym
    const headingId = `gym-card-heading-${gym.id ?? name.replace(/\s+/g, '-').toLowerCase()}`

    const rootTestId = dataTestId || GymsPageTestIds.LIST_ITEM

    return (
      <Card
        className="relative isolate focus-within:ring-2 focus-within:ring-emerald-400/60"
        data-testid={rootTestId}
        role="listitem"
        aria-labelledby={headingId}
      >
        <div
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
          aria-hidden="true"
        />
        <GymHeader
          name={name}
          county={county}
          status={status}
          imageUrl={imageUrl}
          headingId={headingId}
        />

        <CardContent>
          <div className="mb-4">
            <GymDetails gym={gym} />
          </div>
          <div className="flex-grow" />
          <GymFooter websiteUrl={website} gymName={name} />
        </CardContent>
      </Card>
    )
  }
)
