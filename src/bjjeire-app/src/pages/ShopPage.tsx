import type { JSX } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { StoresList } from '@/features/stores/components/store-list'
import { StoresPageHeader } from '@/features/stores/components/stores-page-header'
import { ListSearchInput } from '@/components/ui/search/list-search-input'
import { ListPageShell } from '@/components/layout/list-page-shell'
import { uiContent } from '@/config/ui-content'
import { useStoresPage } from '@/features/stores/hooks/useStoresPage'
import { StoresPageTestIds } from '@/constants/storeDataTestIds'
import { FeaturedMerch } from '@/features/merch/components/featured-merch'

const { search, errors, noData } = uiContent.shop

export default function ShopPage(): JSX.Element {
  useDocumentTitle(uiContent.shop.documentTitle)
  const page = useStoresPage()
  const {
    filteredItems: filteredStores,
    paginationInfo,
    isLoading,
    search: storeSearch,
  } = page

  return (
    <ListPageShell
      content={{ errorMessage: errors.loadFailed, search, noData }}
      page={page}
      renderList={data => <StoresList stores={data} />}
      header={
        <StoresPageHeader
          totalStores={
            storeSearch.isSearchActive
              ? filteredStores.length
              : paginationInfo?.totalItems
          }
        />
      }
      featured={<FeaturedMerch />}
      filterBar={
        <div className="w-full sm:max-w-160">
          <ListSearchInput
            inputId="store-search"
            content={search}
            value={storeSearch.searchTerm}
            onChange={storeSearch.setSearchTerm}
            onClear={storeSearch.clearSearch}
            disabled={isLoading}
            dataTestId={StoresPageTestIds.SEARCH}
          />
        </div>
      }
    />
  )
}
