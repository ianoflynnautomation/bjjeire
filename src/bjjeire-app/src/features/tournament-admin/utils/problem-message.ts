import { isAxiosError } from 'axios'
import { uiContent } from '@/config/ui-content'

const { errors } = uiContent.tournamentAdmin

/** The API's own explanation of a refused write, which is written for the organiser to act on. */
export function problemMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return errors.generic
  }
  if (error.response?.status === 401) {
    return errors.signedOut
  }
  const detail: unknown = (
    error.response?.data as { detail?: unknown } | undefined
  )?.detail
  return typeof detail === 'string' && detail !== '' ? detail : errors.generic
}
