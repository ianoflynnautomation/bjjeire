import type { JSX } from 'react'
import { ListPageHeader } from '@/components/ui/page-header/list-page-header'
import { uiContent } from '@/config/ui-content'
import { TournamentsPageTestIds } from '@/constants/tournamentDataTestIds'

const { pageTitle } = uiContent.tournaments

interface TournamentsPageHeaderProps {
  totalTournaments?: number
}

export const TournamentsPageHeader = function TournamentsPageHeader({
  totalTournaments,
}: TournamentsPageHeaderProps): JSX.Element {
  const suffix =
    totalTournaments === 1
      ? pageTitle.foundSuffixSingular
      : pageTitle.foundSuffixPlural
  const totalLabel =
    totalTournaments === undefined
      ? undefined
      : `${pageTitle.foundPrefix} ${totalTournaments} ${suffix}`

  return (
    <ListPageHeader
      title={pageTitle.all}
      titleAs="h1"
      totalLabel={totalLabel}
      showTotal={totalTournaments !== undefined && totalTournaments > 0}
      testIds={{
        root: TournamentsPageTestIds.HEADER,
        title: TournamentsPageTestIds.HEADER_TITLE,
        total: TournamentsPageTestIds.HEADER_TOTAL,
      }}
    />
  )
}
