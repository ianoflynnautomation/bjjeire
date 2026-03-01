import { memo } from 'react'
import type { GymDto } from '@/types/gyms'
import { GymCard } from './gym-card'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'

interface GymsListProps {
  gyms: GymDto[]
  'data-testid'?: string
}

export const GymsList = memo(function GymsList({
  gyms,
  'data-testid': dataTestId,
}: GymsListProps) {
  const rootListTestId = dataTestId || GymsPageTestIds.LIST

  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"
      data-testid={rootListTestId}
    >
      {gyms.map(gym => (
        <GymCard
          key={gym.id ?? gym.name}
          gym={gym}
          data-testid={GymsPageTestIds.LIST_ITEM}
        />
      ))}
    </div>
  )
})
