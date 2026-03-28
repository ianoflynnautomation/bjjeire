import { memo } from 'react'
import type { JSX } from 'react'
import type { ClassCategory } from '@/types/gyms'
import { getClassCategoryLabel } from '@/utils/gym-display-utils'
import { TagIcon } from '@heroicons/react/20/solid'
import { DetailItem } from '@/components/ui/icons/detail-item'
import { GymCardTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'

const gymCard = uiContent.gyms.card

interface GymOfferedClassesProps {
  classes?: ClassCategory[]
  'data-testid'?: string
}

export const GymOfferedClasses = memo(function GymOfferedClasses({
  classes,
  'data-testid': rootDataTestId,
}: GymOfferedClassesProps): JSX.Element | null {
  if (!classes || classes.length === 0) {
    return null
  }

  return (
    <DetailItem
      icon={<TagIcon />}
      ariaLabel={gymCard.offeredClassesLabel}
      data-testid={rootDataTestId ?? GymCardTestIds.CLASSES}
      className="mt-1"
    >
      <div className="flex flex-wrap gap-1.5">
        {classes.map(category => (
          <span
            key={category}
            className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/30 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
            data-testid={GymCardTestIds.CLASSES_ITEM}
          >
            {getClassCategoryLabel(category)}
          </span>
        ))}
      </div>
    </DetailItem>
  )
})
