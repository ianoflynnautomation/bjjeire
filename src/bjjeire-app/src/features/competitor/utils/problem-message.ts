import { isAxiosError } from 'axios'
import { uiContent } from '@/config/ui-content'

const { errors, form } = uiContent.competitor

/** The API's PascalCase field paths, named as the form labels them. */
const FIELD_LABELS: Record<string, string> = {
  FirstName: form.firstName,
  MiddleName: form.middleName,
  LastName: form.lastName,
  Nationality: form.nationality,
  DateOfBirth: form.dateOfBirth,
  Gender: form.gender,
  Belt: form.belt,
  Academy: form.academy,
  'Academy.GymId': form.academy,
  'Academy.Name': form.academyName,
  Affiliation: form.affiliation,
  Phone: form.phone,
  'Address.Street': form.street,
  'Address.Postcode': form.postcode,
  'Address.City': form.city,
  'Address.Region': form.region,
  'Address.Country': form.country,
}

function fieldMessage(entry: unknown): string | null {
  const { field, message } = entry as { field?: unknown; message?: unknown }
  if (typeof message !== 'string' || message === '') {
    return null
  }
  const label = typeof field === 'string' ? FIELD_LABELS[field] : undefined
  const sentence = message.endsWith('.') ? message : `${message}.`
  return label === undefined ? sentence : `${label}: ${sentence}`
}

/** The API's explanation of a refused request, written for the competitor to act on. */
export function competitorProblemMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return errors.generic
  }
  if (error.response?.status === 401) {
    return errors.signedOut
  }
  const data = error.response?.data as
    { detail?: unknown; errors?: unknown } | undefined
  // A validation problem names what is wrong per field; its detail is generic.
  if (Array.isArray(data?.errors)) {
    const messages = data.errors
      .map(fieldMessage)
      .filter((message): message is string => message !== null)
    if (messages.length > 0) {
      return messages.join(' ')
    }
  }
  const detail = data?.detail
  return typeof detail === 'string' && detail !== '' ? detail : errors.generic
}

/** Whether the API refused because the caller still has an active sign-up. */
export function isActiveRegistrationConflict(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false
  }
  const type: unknown = (error.response?.data as { type?: unknown } | undefined)
    ?.type
  return type === 'urn:bjjeire:has-active-registration'
}
