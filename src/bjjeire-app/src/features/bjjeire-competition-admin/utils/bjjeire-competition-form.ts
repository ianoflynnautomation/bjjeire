import { uiContent } from '@/config/ui-content'
import type {
  DivisionDto,
  BjjEireCompetitionCommand,
  BjjEireCompetitionDto,
  BjjEireCompetitionVenueDto,
} from '@/types/bjjeire-competitions'
import {
  dublinLocalToIso,
  endOfDublinDayIso,
  isoToDublinLocal,
} from '@/utils/dublin-time'

const { validation } = uiContent.bjjEireCompetitionAdmin

/** Every field as the input holds it. Conversion happens in `toCommand`. */
export interface BjjEireCompetitionFormValues {
  name: string
  slug: string
  description: string
  date: string
  venueName: string
  venueAddress: string
  /** Euro, as typed: `25` or `25.50`. */
  entryFee: string
  /** `datetime-local` values read on an Irish clock. */
  opensAt: string
  closesAt: string
  competitorLimit: string
}

export type BjjEireCompetitionFormErrors = Partial<
  Record<keyof BjjEireCompetitionFormValues, string>
>

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const EURO = /^\d+(?:\.\d{1,2})?$/u
const WHOLE = /^\d+$/u
const RESERVED_SLUG = 'admin'
const MAX_NAME = 120
const MAX_DESCRIPTION = 4000
// The API's venue limits (VenueValidator).
const MAX_VENUE = 100
const MAX_ADDRESS = 200

export function emptyBjjEireCompetitionForm(): BjjEireCompetitionFormValues {
  return {
    name: '',
    slug: '',
    description: '',
    date: '',
    venueName: '',
    venueAddress: '',
    entryFee: '',
    opensAt: '',
    closesAt: '',
    competitorLimit: '',
  }
}

export function toFormValues(
  bjjEireCompetition: BjjEireCompetitionDto
): BjjEireCompetitionFormValues {
  return {
    name: bjjEireCompetition.name,
    slug: bjjEireCompetition.slug,
    description: bjjEireCompetition.description ?? '',
    date: bjjEireCompetition.date,
    venueName: bjjEireCompetition.venue?.venue ?? '',
    venueAddress: bjjEireCompetition.venue?.address ?? '',
    entryFee: (bjjEireCompetition.entryFeeCents / 100).toFixed(2),
    opensAt: isoToDublinLocal(bjjEireCompetition.registrationOpensAt),
    closesAt: isoToDublinLocal(bjjEireCompetition.registrationClosesAt),
    competitorLimit:
      bjjEireCompetition.competitorLimit === null ||
      bjjEireCompetition.competitorLimit === undefined
        ? ''
        : String(bjjEireCompetition.competitorLimit),
  }
}

/** Whole cents from typed euro, without floating-point arithmetic. Null when it is not an amount. */
export function parseEuroToCents(text: string): number | null {
  const trimmed = text.trim()
  if (!EURO.test(trimmed)) {
    return null
  }
  const [euro, cents = ''] = trimmed.split('.')
  return Number(euro) * 100 + Number(cents.padEnd(2, '0'))
}

function slugError(slug: string): string | undefined {
  if (slug === '') {
    return validation.slugRequired
  }
  if (slug === RESERVED_SLUG) {
    return validation.slugReserved
  }
  return SLUG.test(slug) ? undefined : validation.slugInvalid
}

function closesAtError(
  values: BjjEireCompetitionFormValues
): string | undefined {
  const closes = dublinLocalToIso(values.closesAt)
  if (closes === null) {
    return validation.closesAtRequired
  }
  const opens = dublinLocalToIso(values.opensAt)
  if (opens !== null && closes <= opens) {
    return validation.windowOrder
  }
  const endOfDay = endOfDublinDayIso(values.date)
  if (endOfDay !== null && closes > endOfDay) {
    return validation.windowAfterDay
  }
  return undefined
}

/** The same rules the API applies on save and on publish, so the organiser hears about them before sending. */
export function validateBjjEireCompetitionForm(
  values: BjjEireCompetitionFormValues
): BjjEireCompetitionFormErrors {
  const name = values.name.trim()
  const limit = values.competitorLimit.trim()
  const candidates: BjjEireCompetitionFormErrors = {
    name:
      name === ''
        ? validation.nameRequired
        : name.length > MAX_NAME
          ? validation.nameTooLong
          : undefined,
    slug: slugError(values.slug.trim()),
    description:
      values.description.length > MAX_DESCRIPTION
        ? validation.descriptionTooLong
        : undefined,
    date: values.date === '' ? validation.dateRequired : undefined,
    venueName:
      values.venueName.trim() === ''
        ? validation.venueNameRequired
        : values.venueName.trim().length > MAX_VENUE
          ? validation.venueNameTooLong
          : undefined,
    venueAddress:
      values.venueAddress.trim().length > MAX_ADDRESS
        ? validation.venueAddressTooLong
        : undefined,
    entryFee:
      parseEuroToCents(values.entryFee) === null
        ? validation.feeInvalid
        : undefined,
    opensAt:
      dublinLocalToIso(values.opensAt) === null
        ? validation.opensAtRequired
        : undefined,
    closesAt: closesAtError(values),
    competitorLimit:
      limit !== '' && (!WHOLE.test(limit) || Number(limit) < 1)
        ? validation.limitInvalid
        : undefined,
  }
  const found: BjjEireCompetitionFormErrors = {}
  for (const [field, message] of Object.entries(candidates) as [
    keyof BjjEireCompetitionFormValues,
    string | undefined,
  ][]) {
    if (message !== undefined) {
      found[field] = message
    }
  }
  return found
}

/**
 * Builds the request body from values that passed validation.
 *
 * @param existingVenue the stored venue, so map coordinates the form does not edit are not lost
 */
export function toCommand(
  values: BjjEireCompetitionFormValues,
  divisions: readonly DivisionDto[],
  existingVenue?: BjjEireCompetitionVenueDto | null
): BjjEireCompetitionCommand {
  const description = values.description.trim()
  const limit = values.competitorLimit.trim()
  return {
    slug: values.slug.trim(),
    name: values.name.trim(),
    description: description === '' ? null : description,
    date: values.date,
    venue: {
      venue: values.venueName.trim(),
      address: values.venueAddress.trim(),
      ...(existingVenue?.coordinates
        ? { coordinates: existingVenue.coordinates }
        : {}),
    },
    entryFeeCents: parseEuroToCents(values.entryFee) ?? 0,
    registrationOpensAt: dublinLocalToIso(values.opensAt) ?? '',
    registrationClosesAt: dublinLocalToIso(values.closesAt) ?? '',
    competitorLimit: limit === '' ? null : Number(limit),
    divisions: [...divisions],
  }
}
