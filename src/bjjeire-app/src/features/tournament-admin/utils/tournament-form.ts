import { uiContent } from '@/config/ui-content'
import type {
  DivisionDto,
  TournamentCommand,
  TournamentDto,
  TournamentVenueDto,
} from '@/types/tournaments'
import {
  dublinLocalToIso,
  endOfDublinDayIso,
  isoToDublinLocal,
} from '@/utils/dublin-time'

const { validation } = uiContent.tournamentAdmin

/** Every field as the input holds it. Conversion happens in `toCommand`. */
export interface TournamentFormValues {
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

export type TournamentFormErrors = Partial<
  Record<keyof TournamentFormValues, string>
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

export function emptyTournamentForm(): TournamentFormValues {
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

export function toFormValues(tournament: TournamentDto): TournamentFormValues {
  return {
    name: tournament.name,
    slug: tournament.slug,
    description: tournament.description ?? '',
    date: tournament.date,
    venueName: tournament.venue?.venue ?? '',
    venueAddress: tournament.venue?.address ?? '',
    entryFee: (tournament.entryFeeCents / 100).toFixed(2),
    opensAt: isoToDublinLocal(tournament.registrationOpensAt),
    closesAt: isoToDublinLocal(tournament.registrationClosesAt),
    competitorLimit:
      tournament.competitorLimit === null ||
      tournament.competitorLimit === undefined
        ? ''
        : String(tournament.competitorLimit),
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

function closesAtError(values: TournamentFormValues): string | undefined {
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
export function validateTournamentForm(
  values: TournamentFormValues
): TournamentFormErrors {
  const name = values.name.trim()
  const limit = values.competitorLimit.trim()
  const candidates: TournamentFormErrors = {
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
  const found: TournamentFormErrors = {}
  for (const [field, message] of Object.entries(candidates) as [
    keyof TournamentFormValues,
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
  values: TournamentFormValues,
  divisions: readonly DivisionDto[],
  existingVenue?: TournamentVenueDto | null
): TournamentCommand {
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
