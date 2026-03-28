import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { useDebounce } from '@/hooks/useDebounce'
import type { BjjEventDto } from '@/types/event'

const SEARCH_PARAM = 'q'

function eventMatchesSearch(event: BjjEventDto, term: string): boolean {
  const lower = term.toLowerCase()
  return (
    event.name.toLowerCase().includes(lower) ||
    (event.description?.toLowerCase().includes(lower) ?? false) ||
    event.county.toLowerCase().includes(lower) ||
    (event.location?.address?.toLowerCase().includes(lower) ?? false) ||
    (event.organiser?.name?.toLowerCase().includes(lower) ?? false)
  )
}

export interface UseEventSearchResult {
  searchTerm: string
  debouncedSearchTerm: string
  setSearchTerm: (term: string) => void
  clearSearch: () => void
  filterEvents: (events: BjjEventDto[]) => BjjEventDto[]
  isSearchActive: boolean
}

export function useEventSearch(): UseEventSearchResult {
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

  const filterEvents = useCallback(
    (events: BjjEventDto[]): BjjEventDto[] => {
      if (!debouncedSearchTerm.trim()) {
        return events
      }
      return events.filter(event =>
        eventMatchesSearch(event, debouncedSearchTerm)
      )
    },
    [debouncedSearchTerm]
  )

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    clearSearch,
    filterEvents,
    isSearchActive: debouncedSearchTerm.trim().length > 0,
  }
}
