import { isAxiosError } from 'axios'
import { uiContent } from '@/config/ui-content'

const { errors } = uiContent.merchAdmin

/** The problem type of a refused request, such as `urn:bjjeire:stock-below-held`. */
export function problemType(error: unknown): string | undefined {
  if (!isAxiosError(error)) {
    return undefined
  }
  const type: unknown = (error.response?.data as { type?: unknown } | undefined)
    ?.type
  return typeof type === 'string' ? type : undefined
}

/** The API's own explanation of a refused write, which is written for the organiser to act on. */
export function problemMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return errors.generic
  }
  if (error.response?.status === 401) {
    return errors.signedOut
  }
  if (
    problemType(error) === 'urn:bjjeire:conflict' &&
    detail(error).includes('Reload')
  ) {
    return errors.stale
  }
  return detail(error) || errors.generic
}

function detail(error: unknown): string {
  if (!isAxiosError(error)) {
    return ''
  }
  const value: unknown = (
    error.response?.data as { detail?: unknown } | undefined
  )?.detail
  return typeof value === 'string' ? value : ''
}
