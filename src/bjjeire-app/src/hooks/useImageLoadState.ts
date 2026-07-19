import { useCallback, useState } from 'react'

interface ImageLoadState {
  isLoaded: boolean
  hasError: boolean
  handleLoad: () => void
  handleError: () => void
}

export function useImageLoadState(): ImageLoadState {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => setIsLoaded(true), [])
  const handleError = useCallback(() => setHasError(true), [])

  return { isLoaded, hasError, handleLoad, handleError }
}
