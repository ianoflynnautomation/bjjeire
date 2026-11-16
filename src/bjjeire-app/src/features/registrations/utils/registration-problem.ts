import { isAxiosError } from 'axios'
import { uiContent } from '@/config/ui-content'

const { problems } = uiContent.registrations

type KnownProblem = Exclude<keyof typeof problems, 'fallback'>

function isKnown(type: string): type is KnownProblem {
  return type !== 'fallback' && Object.keys(problems).includes(type)
}

/** The `urn:bjjeire:*` type of a refused sign-up request, or null. */
export function registrationProblemType(error: unknown): string | null {
  if (!isAxiosError(error)) {
    return null
  }
  const type = (error.response?.data as { type?: unknown } | undefined)?.type
  return typeof type === 'string' ? type : null
}

/** Why a sign-up was refused, in words the competitor can act on. */
export function registrationProblemMessage(error: unknown): string {
  const type = registrationProblemType(error)
  return type !== null && isKnown(type) ? problems[type] : problems.fallback
}

/** Why a cancel or division change was refused; an unknown failure reads as "did not work", not as a sign-up. */
export function registrationActionMessage(error: unknown): string {
  const type = registrationProblemType(error)
  return type !== null && isKnown(type)
    ? problems[type]
    : uiContent.registrations.mine.actionFailed
}
