import React, { memo } from 'react'
import type { ClassCategory } from '@/types/gyms'
import { getClassCategoryLabel } from '@/utils/gymDisplayUtils'
import { TagIcon } from '@heroicons/react/20/solid'
import { DetailItem } from '@/components/ui/icons/detail-item'
import { GymCardTestIds } from '@/constants/gymDataTestIds'

interface GymOfferedClassesProps {
  classes?: ClassCategory[]
  'data-testid'?: string
}

export const GymOfferedClasses: React.FC<GymOfferedClassesProps> = memo(
  ({ classes, 'data-testid': rootDataTestId }) => {
    if (!classes || classes.length === 0) {
      return null
    }

    // The root test ID now defaults to the static constant for the classes section.
    const actualRootDataTestId = rootDataTestId || GymCardTestIds.CLASSES

    return (
      <DetailItem
        icon={<TagIcon />}
        ariaLabel="Offered Classes"
        data-testid={actualRootDataTestId}
        className="mt-1"
      >
        <div className="flex flex-wrap gap-1.5">
          {classes.map(category => (
            <span
              key={category}
              className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200"
              data-testid={GymCardTestIds.CLASSES_ITEM}
            >
              {getClassCategoryLabel(category)}
            </span>
          ))}
        </div>
      </DetailItem>
    )
  }
)