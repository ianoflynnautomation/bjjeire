import { uiContent } from '@/config/ui-content'

const { errors } = uiContent.shared

export function formatFetchError(error: unknown): string {
  if (!error) {
    return errors.unexpected
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    const code = (error as { code?: unknown }).code
    // Browser fetch network failures surface as TypeErrors with these
    // messages (Chrome, Firefox, Safari); other TypeErrors are code bugs
    if (
      code === 'ERR_NETWORK' ||
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('network error') ||
      message.includes('load failed')
    ) {
      return errors.network
    }
    return error.message || errors.unexpected
  }

  if (typeof error === 'string') {
    return error
  }

  return errors.unexpected
}
