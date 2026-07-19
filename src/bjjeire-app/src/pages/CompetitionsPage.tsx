import type { JSX } from 'react'
import { CompetitionsList } from '@/features/competitions/components/competitions-list'
import { CompetitionsPageHeader } from '@/features/competitions/components/competitions-page-header'
import { ListSearchInput } from '@/components/ui/search/list-search-input'
import { ListPageShell } from '@/components/layout/list-page-shell'
import { uiContent } from '@/config/ui-content'
import { useCompetitionsPage } from '@/features/competitions/hooks/useCompetitionsPage'
import { CompetitionsPageTestIds } from '@/constants/competitionDataTestIds'

const { search, errors, noData } = uiContent.competitions

export default function CompetitionsPage(): JSX.Element {
  const page = useCompetitionsPage()
  const {
    filteredItems: filteredCompetitions,
    paginationInfo,
    isLoading,
    search: competitionSearch,
  } = page

  return (
    <ListPageShell
      content={{ errorMessage: errors.loadFailed, search, noData }}
      page={page}
      renderList={data => <CompetitionsList competitions={data} />}
      header={
        <CompetitionsPageHeader
          totalCompetitions={
            competitionSearch.isSearchActive
              ? filteredCompetitions.length
              : paginationInfo?.totalItems
          }
        />
      }
      filterBar={
        <div className="sm:w-160 shrink-0">
          <ListSearchInput
            inputId="competition-search"
            content={search}
            value={competitionSearch.searchTerm}
            onChange={competitionSearch.setSearchTerm}
            onClear={competitionSearch.clearSearch}
            disabled={isLoading}
            dataTestId={CompetitionsPageTestIds.SEARCH}
          />
        </div>
      }
    />
  )
}
