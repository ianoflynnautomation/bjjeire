import { memo } from 'react'
import type { JSX } from 'react'
import { ListPageHeader } from '@/components/ui/page-header/list-page-header'
import { StoresPageTestIds } from '@/constants/storeDataTestIds'
import { uiContent } from '@/config/ui-content'

const { pageTitle } = uiContent.stores

interface StoresPageHeaderProps {
  totalStores?: number
  'data-testid'?: string
}

export const StoresPageHeader = memo(function StoresPageHeader({
  totalStores,
  'data-testid': baseTestId = StoresPageTestIds.HEADER,
}: StoresPageHeaderProps): JSX.Element {
  const suffix =
    totalStores === 1
      ? pageTitle.foundSuffixSingular
      : pageTitle.foundSuffixPlural
  const totalLabel =
    totalStores === undefined
      ? undefined
      : `${pageTitle.foundPrefix} ${totalStores} ${suffix}`

  return (
    <ListPageHeader
      title={pageTitle.all}
      totalLabel={totalLabel}
      showTotal={totalStores !== undefined && totalStores > 0}
      testIds={{
        root: baseTestId,
        title: StoresPageTestIds.HEADER_TITLE,
        total: StoresPageTestIds.HEADER_TOTAL,
      }}
    />
  )
})
