import { memo } from 'react'
import type { GymDto } from '@/types/gyms'
import { GymCard } from './gym-card'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'

interface GymsListProps {
  gyms: GymDto[]
  'data-testid'?: string
}

export const GymsList = memo(function GymsList({
  gyms,
  'data-testid': dataTestId,
}: GymsListProps) {
  const rootListTestId = dataTestId ?? GymsPageTestIds.LIST

  return (
    <ul
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center list-none"
      data-testid={rootListTestId}
      aria-label={uiContent.gyms.list.ariaLabel}
    >
      {gyms.map(gym => (
        <li key={gym.id ?? gym.name} className="w-full">
          <GymCard gym={gym} data-testid={GymsPageTestIds.LIST_ITEM} />
        </li>
      ))}
    </ul>
  )
})
