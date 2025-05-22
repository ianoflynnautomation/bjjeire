export const formatFetchError = (error: any): string => {
  if (!error) return 'An unexpected error occurred. Please try again.';
  if (error instanceof Error) {
    if (
      error.message?.includes('failed to fetch') ||
      error.message?.includes('NetworkError')
    ) {
      return 'Could not connect to the server. Please check your internet connection and try again.';
    }
    return error.message || 'An unexpected error occurred. Please try again.';
  }
  return 'An unexpected error occurred.';
};