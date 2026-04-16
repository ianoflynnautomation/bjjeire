import { memo } from 'react'
import type { JSX } from 'react'
import { ListPageHeader } from '@/components/ui/page-header/list-page-header'
import { CompetitionsPageTestIds } from '@/constants/competitionDataTestIds'
import { uiContent } from '@/config/ui-content'

const { pageTitle } = uiContent.competitions

interface CompetitionsPageHeaderProps {
  totalCompetitions?: number
  'data-testid'?: string
}

export const CompetitionsPageHeader = memo(function CompetitionsPageHeader({
  totalCompetitions,
  'data-testid': baseTestId = CompetitionsPageTestIds.HEADER,
}: CompetitionsPageHeaderProps): JSX.Element {
  const suffix =
    totalCompetitions === 1
      ? pageTitle.foundSuffixSingular
      : pageTitle.foundSuffixPlural
  const totalLabel =
    totalCompetitions === undefined
      ? undefined
      : `${pageTitle.foundPrefix} ${totalCompetitions} ${suffix}`

  return (
    <ListPageHeader
      title={pageTitle.all}
      totalLabel={totalLabel}
      showTotal={totalCompetitions !== undefined && totalCompetitions > 0}
      testIds={{
        root: baseTestId,
        title: CompetitionsPageTestIds.HEADER_TITLE,
        total: CompetitionsPageTestIds.HEADER_TOTAL,
      }}
    />
  )
})
