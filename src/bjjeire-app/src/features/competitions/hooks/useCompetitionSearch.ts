import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { useDebounce } from '@/hooks/useDebounce'
import type { CompetitionDto } from '@/types/competitions'
import { COMPETITION_ORGANISATION_LABELS } from '@/types/competitions'

const SEARCH_PARAM = 'q'

function competitionMatchesSearch(
  competition: CompetitionDto,
  term: string
): boolean {
  const lower = term.toLowerCase()
  const orgLabel =
    COMPETITION_ORGANISATION_LABELS[competition.organisation] ?? ''
  return (
    competition.name.toLowerCase().includes(lower) ||
    (competition.description?.toLowerCase().includes(lower) ?? false) ||
    competition.country.toLowerCase().includes(lower) ||
    orgLabel.toLowerCase().includes(lower) ||
    competition.tags.some(t => t.toLowerCase().includes(lower))
  )
}

export interface UseCompetitionSearchResult {
  searchTerm: string
  debouncedSearchTerm: string
  setSearchTerm: (term: string) => void
  clearSearch: () => void
  filterCompetitions: (competitions: CompetitionDto[]) => CompetitionDto[]
  isSearchActive: boolean
}

export function useCompetitionSearch(): UseCompetitionSearchResult {
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

  const filterCompetitions = useCallback(
    (competitions: CompetitionDto[]): CompetitionDto[] => {
      if (!debouncedSearchTerm.trim()) {
        return competitions
      }
      return competitions.filter(c =>
        competitionMatchesSearch(c, debouncedSearchTerm)
      )
    },
    [debouncedSearchTerm]
  )

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    clearSearch,
    filterCompetitions,
    isSearchActive: debouncedSearchTerm.trim().length > 0,
  }
}
