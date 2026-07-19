import type { JSX } from 'react'
import { GymsList } from '@/features/gyms/components/gym-list'
import { GymsPageHeader } from '@/features/gyms/components/gym-page-header'
import { GymsHeroBanner } from '@/features/gyms/components/gyms-hero-banner'
import { ListSearchInput } from '@/components/ui/search/list-search-input'
import SelectFilter from '@/components/ui/filters/select-filter'
import { COUNTIES } from '@/constants/counties'
import { ListPageShell } from '@/components/layout/list-page-shell'
import { uiContent } from '@/config/ui-content'
import { useGymsPage } from '@/features/gyms/hooks/useGymsPage'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'

const { filters, search, errors, noData } = uiContent.gyms

export default function GymsPage(): JSX.Element {
  const page = useGymsPage()
  const {
    filteredItems: filteredGyms,
    paginationInfo,
    isLoading,
    isFetching,
    activeFilters,
    countyLabel,
    handleCountyChange,
    search: gymSearch,
  } = page

  return (
    <ListPageShell
      content={{ errorMessage: errors.loadFailed, search, noData }}
      page={page}
      renderList={data => <GymsList gyms={data} />}
      hero={<GymsHeroBanner />}
      header={
        <GymsPageHeader
          countyName={countyLabel}
          totalGyms={
            gymSearch.isSearchActive
              ? filteredGyms.length
              : paginationInfo?.totalItems
          }
        />
      }
      filterBar={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <SelectFilter
            id="county-filter"
            label={filters.countyLabel}
            value={activeFilters.county}
            onChange={handleCountyChange}
            options={COUNTIES}
            placeholderOptionLabel={filters.allCountiesOption}
            disabled={isFetching || isLoading}
            className="sm:w-64 shrink-0"
          />
          <div className="sm:w-160 shrink-0">
            <ListSearchInput
              inputId="gym-search"
              content={search}
              value={gymSearch.searchTerm}
              onChange={gymSearch.setSearchTerm}
              onClear={gymSearch.clearSearch}
              disabled={isLoading}
              dataTestId={GymsPageTestIds.SEARCH}
            />
          </div>
        </div>
      }
    />
  )
}
