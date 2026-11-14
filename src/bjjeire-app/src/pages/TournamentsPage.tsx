import type { JSX } from 'react'
import { ListPageShell } from '@/components/layout/list-page-shell'
import { ListSearchInput } from '@/components/ui/search/list-search-input'
import { uiContent } from '@/config/ui-content'
import { TournamentsPageTestIds } from '@/constants/tournamentDataTestIds'
import { TournamentsList } from '@/features/tournaments/components/tournaments-list'
import { TournamentsPageHeader } from '@/features/tournaments/components/tournaments-page-header'
import { useTournamentsPage } from '@/features/tournaments/hooks/useTournamentsPage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const { search, errors, noData } = uiContent.tournaments

export default function TournamentsPage(): JSX.Element {
  useDocumentTitle(uiContent.tournaments.documentTitle)
  const page = useTournamentsPage()
  const {
    filteredItems,
    paginationInfo,
    isLoading,
    search: tournamentSearch,
  } = page

  return (
    <ListPageShell
      content={{ errorMessage: errors.loadFailed, search, noData }}
      page={page}
      renderList={data => <TournamentsList tournaments={data} />}
      header={
        <TournamentsPageHeader
          totalTournaments={
            tournamentSearch.isSearchActive
              ? filteredItems.length
              : paginationInfo?.totalItems
          }
        />
      }
      filterBar={
        <div className="w-full sm:max-w-160">
          <ListSearchInput
            inputId="tournament-search"
            content={search}
            value={tournamentSearch.searchTerm}
            onChange={tournamentSearch.setSearchTerm}
            onClear={tournamentSearch.clearSearch}
            disabled={isLoading}
            dataTestId={TournamentsPageTestIds.SEARCH}
          />
        </div>
      }
    />
  )
}
