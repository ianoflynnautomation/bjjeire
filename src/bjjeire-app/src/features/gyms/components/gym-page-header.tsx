import { memo } from 'react'
import type { JSX } from 'react'
import { ListPageHeader } from '@/components/ui/page-header/list-page-header'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'

const { pageTitle } = uiContent.gyms

interface GymsPageHeaderProps {
  countyName?: string
  totalGyms?: number
  'data-testid'?: string
}

export const GymsPageHeader = memo(function GymsPageHeader({
  countyName,
  totalGyms,
  'data-testid': baseTestId = GymsPageTestIds.HEADER,
}: GymsPageHeaderProps): JSX.Element {
  const hasCounty = countyName && countyName.toLowerCase() !== 'all'
  const title = hasCounty ? `${pageTitle.prefix} ${countyName}` : pageTitle.all

  const suffix =
    totalGyms === 1
      ? pageTitle.foundSuffixSingular
      : pageTitle.foundSuffixPlural
  const totalLabel =
    totalGyms === undefined
      ? undefined
      : `${pageTitle.foundPrefix} ${totalGyms} ${suffix}`

  return (
    <ListPageHeader
      title={title}
      totalLabel={totalLabel}
      showTotal={totalGyms !== undefined && totalGyms > 0}
      testIds={{
        root: baseTestId,
        title: GymsPageTestIds.HEADER_TITLE,
        total: GymsPageTestIds.HEADER_TOTAL,
      }}
    />
  )
})
