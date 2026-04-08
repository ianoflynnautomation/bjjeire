import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { useDebounce } from '@/hooks/useDebounce'
import type { StoreDto } from '@/types/stores'

const SEARCH_PARAM = 'q'

function storeMatchesSearch(store: StoreDto, term: string): boolean {
  const lower = term.toLowerCase()
  return (
    store.name.toLowerCase().includes(lower) ||
    (store.description?.toLowerCase().includes(lower) ?? false)
  )
}

export interface UseStoreSearchResult {
  searchTerm: string
  debouncedSearchTerm: string
  setSearchTerm: (term: string) => void
  clearSearch: () => void
  filterStores: (stores: StoreDto[]) => StoreDto[]
  isSearchActive: boolean
}

export function useStoreSearch(): UseStoreSearchResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get(SEARCH_PARAM) ?? ''
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const setSearchTerm = useCallback(
    (term: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (term) {
            next.set(SEARCH_PARAM, term)
          } else {
            next.delete(SEARCH_PARAM)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const clearSearch = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(SEARCH_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const filterStores = useCallback(
    (stores: StoreDto[]): StoreDto[] => {
      if (!debouncedSearchTerm.trim()) {
        return stores
      }
      return stores.filter(s => storeMatchesSearch(s, debouncedSearchTerm))
    },
    [debouncedSearchTerm]
  )

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    clearSearch,
    filterStores,
    isSearchActive: debouncedSearchTerm.trim().length > 0,
  }
}
