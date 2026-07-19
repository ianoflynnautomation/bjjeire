import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { useDebounce } from '@/hooks/useDebounce'

const SEARCH_PARAM = 'q'

export interface UseListPageSearchResult<T> {
  searchTerm: string
  debouncedSearchTerm: string
  setSearchTerm: (term: string) => void
  clearSearch: () => void
  filterItems: (items: T[]) => T[]
  isSearchActive: boolean
}

export function useListPageSearch<T>(
  matchesSearch: (item: T, term: string) => boolean
): UseListPageSearchResult<T> {
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

  const filterItems = useCallback(
    (items: T[]): T[] => {
      const term = debouncedSearchTerm.trim()
      if (!term) {
        return items
      }
      return items.filter(item => matchesSearch(item, term))
    },
    [debouncedSearchTerm, matchesSearch]
  )

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    clearSearch,
    filterItems,
    isSearchActive: debouncedSearchTerm.trim().length > 0,
  }
}
