import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { useDebounce } from '@/hooks/useDebounce'
import type { GymDto } from '@/types/gyms'

const SEARCH_PARAM = 'q'

function gymMatchesSearch(gym: GymDto, term: string): boolean {
  const lower = term.toLowerCase()
  return (
    gym.name.toLowerCase().includes(lower) ||
    (gym.description?.toLowerCase().includes(lower) ?? false) ||
    gym.county.toLowerCase().includes(lower) ||
    (gym.location?.address?.toLowerCase().includes(lower) ?? false) ||
    gym.offeredClasses.some(c => c.toLowerCase().includes(lower))
  )
}

export interface UseGymSearchResult {
  searchTerm: string
  debouncedSearchTerm: string
  setSearchTerm: (term: string) => void
  clearSearch: () => void
  filterGyms: (gyms: GymDto[]) => GymDto[]
  isSearchActive: boolean
}

export function useGymSearch(): UseGymSearchResult {
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

  const filterGyms = useCallback(
    (gyms: GymDto[]): GymDto[] => {
      if (!debouncedSearchTerm.trim()) {
        return gyms
      }
      return gyms.filter(gym => gymMatchesSearch(gym, debouncedSearchTerm))
    },
    [debouncedSearchTerm]
  )

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    clearSearch,
    filterGyms,
    isSearchActive: debouncedSearchTerm.trim().length > 0,
  }
}
