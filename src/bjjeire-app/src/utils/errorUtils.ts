export const formatFetchError = (error: unknown): string => {
  const defaultMessage = 'An unexpected error occurred. Please try again.'

  if (!error) return defaultMessage

  if (error instanceof Error) {
    if (
      error.message?.toLowerCase().includes('failed to fetch') ||
      error.message?.toLowerCase().includes('networkerror') ||
      error.name === 'TypeError'
    ) {
      return 'Could not connect to the server. Please check your internet connection and try again.'
    }
    return error.message || defaultMessage
  }

  if (typeof error === 'string') {
    return error
  }

  return defaultMessage
}
