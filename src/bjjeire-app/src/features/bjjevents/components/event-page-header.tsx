import { memo } from 'react'
import type { JSX } from 'react'
import { ListPageHeader } from '@/components/ui/page-header/list-page-header'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'
import { uiContent } from '@/config/ui-content'

const { pageTitle } = uiContent.events

interface EventsPageHeaderProps {
  countyName?: string
  totalEvents?: number
  'data-testid'?: string
}

export const EventsPageHeader = memo(function EventsPageHeader({
  countyName,
  totalEvents,
  'data-testid': baseTestId = EventsPageTestIds.HEADER,
}: EventsPageHeaderProps): JSX.Element {
  const isAllCounties = !countyName || countyName.toLowerCase() === 'all'
  const title = isAllCounties
    ? pageTitle.all
    : `${pageTitle.prefix} ${countyName}`

  const suffix =
    totalEvents === 1
      ? pageTitle.foundSuffixSingular
      : pageTitle.foundSuffixPlural
  const totalLabel =
    totalEvents === undefined
      ? undefined
      : `${pageTitle.foundPrefix} ${totalEvents} ${suffix}`

  return (
    <ListPageHeader
      title={title}
      totalLabel={totalLabel}
      showTotal={totalEvents !== undefined && totalEvents > 0}
      testIds={{
        root: baseTestId,
        title: EventsPageTestIds.HEADER_TITLE,
        total: EventsPageTestIds.HEADER_TOTAL,
      }}
    />
  )
})
