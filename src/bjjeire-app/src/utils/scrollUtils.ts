import { useCallback } from 'react'

export const useScrollToTop = (): (() => void) => {
  return useCallback((): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
}
