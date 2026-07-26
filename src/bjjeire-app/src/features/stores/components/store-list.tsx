import type { CSSProperties, JSX } from 'react'
import type { StoreDto } from '@/types/stores'
import { StoresPageTestIds } from '@/constants/storeDataTestIds'
import { uiContent } from '@/config/ui-content'
import { StoreCard } from './store-card/store-card'

const { list } = uiContent.stores

interface StoresListProps {
  stores: StoreDto[]
}

export const StoresList = function StoresList({
  stores,
}: StoresListProps): JSX.Element {
  return (
    <ul
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-label={list.ariaLabel}
      data-testid={StoresPageTestIds.LIST}
    >
      {stores.map((store, index) => (
        <li
          key={store.id}
          className="animate-rise"
          style={{ '--i': index } as CSSProperties}
        >
          <StoreCard store={store} />
        </li>
      ))}
    </ul>
  )
}
