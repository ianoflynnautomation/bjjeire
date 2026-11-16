import { uiContent } from '@/config/ui-content'
import type { Belt, Gender } from '@/types/bjjeire-competitions'
import type {
  CompetitorDto,
  PostalAddressDto,
  SaveCompetitorCommand,
} from '@/types/competitor'

const { validation } = uiContent.competitor

/** How the competitor names their academy (#5008). */
export type AcademyMode = 'directory' | 'typed' | 'none'

export interface ProfileFormValues {
  firstName: string
  middleName: string
  lastName: string
  nationality: string
  /** `YYYY-MM-DD`, as a date input gives it. */
  dateOfBirth: string
  gender: Gender | ''
  belt: Belt | ''
  academyMode: AcademyMode
  academyGymId: string
  /** The typed name, or the chosen gym's name for display. */
  academyName: string
  affiliation: string
  phone: string
  street: string
  postcode: string
  city: string
  region: string
  country: string
}

export type ProfileFormErrors = Partial<Record<keyof ProfileFormValues, string>>

/** The API's limits (SaveCompetitorCommand); the API checks them again. */
const NAME_MAX = 60
const TEAM_MAX = 80
const PHONE_PATTERN = /^\+?\d[\d ()-]{5,28}$/u
const ADDRESS_MAX: Partial<Record<keyof ProfileFormValues, number>> = {
  street: 200,
  postcode: 20,
  city: 100,
  region: 100,
}

export function emptyProfileForm(): ProfileFormValues {
  return {
    firstName: '',
    middleName: '',
    lastName: '',
    nationality: '',
    dateOfBirth: '',
    gender: '',
    belt: '',
    academyMode: 'typed',
    academyGymId: '',
    academyName: '',
    affiliation: '',
    phone: '',
    street: '',
    postcode: '',
    city: '',
    region: '',
    country: '',
  }
}

export function profileFormFrom(profile: CompetitorDto): ProfileFormValues {
  const { academy, address } = profile
  let academyMode: AcademyMode = 'none'
  if (academy) {
    academyMode = academy.gymId ? 'directory' : 'typed'
  }
  return {
    firstName: profile.firstName ?? '',
    middleName: profile.middleName ?? '',
    lastName: profile.lastName ?? '',
    nationality: profile.nationality ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    gender: profile.gender ?? '',
    belt: profile.belt ?? '',
    academyMode,
    academyGymId: academy?.gymId ?? '',
    academyName: academy?.name ?? '',
    affiliation: profile.affiliation ?? '',
    phone: profile.phone ?? '',
    street: address?.street ?? '',
    postcode: address?.postcode ?? '',
    city: address?.city ?? '',
    region: address?.region ?? '',
    country: address?.country ?? '',
  }
}

/**
 * Checks the form before it is sent. Nationality, gender and belt are asked
 * for here because a sign-up needs them, though the API would store a
 * profile without them.
 *
 * @param today `YYYY-MM-DD` in Irish time
 */
export function validateProfileForm(
  values: ProfileFormValues,
  today: string
): ProfileFormErrors {
  const errors: ProfileFormErrors = {}
  const required = (
    field: keyof ProfileFormValues,
    message: string
  ): boolean => {
    if (values[field].trim() === '') {
      errors[field] = message
      return false
    }
    return true
  }
  const atMost = (
    field: keyof ProfileFormValues,
    max: number,
    message: string
  ): void => {
    if (values[field].trim().length > max) {
      errors[field] = message
    }
  }

  if (required('firstName', validation.firstNameRequired)) {
    atMost('firstName', NAME_MAX, validation.nameTooLong)
  }
  atMost('middleName', NAME_MAX, validation.nameTooLong)
  if (required('lastName', validation.lastNameRequired)) {
    atMost('lastName', NAME_MAX, validation.nameTooLong)
  }
  required('nationality', validation.nationalityRequired)
  if (
    required('dateOfBirth', validation.dateOfBirthRequired) &&
    values.dateOfBirth >= today
  ) {
    errors.dateOfBirth = validation.dateOfBirthPast
  }
  required('gender', validation.genderRequired)
  required('belt', validation.beltRequired)

  if (values.academyMode === 'directory') {
    required('academyGymId', validation.academyGymRequired)
  } else if (
    values.academyMode === 'typed' &&
    required('academyName', validation.academyNameRequired)
  ) {
    atMost('academyName', TEAM_MAX, validation.teamTooLong)
  }
  atMost('affiliation', TEAM_MAX, validation.teamTooLong)

  const phone = values.phone.trim()
  if (phone !== '' && !PHONE_PATTERN.test(phone)) {
    errors.phone = validation.phoneInvalid
  }
  for (const [field, max] of Object.entries(ADDRESS_MAX)) {
    atMost(field as keyof ProfileFormValues, max, validation.addressTooLong)
  }
  return errors
}

function optional(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function addressFrom(values: ProfileFormValues): PostalAddressDto | null {
  const address = {
    street: optional(values.street),
    postcode: optional(values.postcode),
    city: optional(values.city),
    region: optional(values.region),
    country: optional(values.country),
  }
  return Object.values(address).every(part => part === null) ? null : address
}

export function toSaveCompetitorCommand(
  values: ProfileFormValues
): SaveCompetitorCommand {
  let academy: SaveCompetitorCommand['academy'] = null
  if (values.academyMode === 'directory') {
    academy = { gymId: values.academyGymId }
  } else if (values.academyMode === 'typed') {
    academy = { name: values.academyName.trim() }
  }
  return {
    firstName: values.firstName.trim(),
    middleName: optional(values.middleName),
    lastName: values.lastName.trim(),
    nationality: optional(values.nationality),
    dateOfBirth: values.dateOfBirth,
    gender: values.gender === '' ? null : values.gender,
    belt: values.belt === '' ? null : values.belt,
    academy,
    affiliation: optional(values.affiliation),
    phone: optional(values.phone),
    address: addressFrom(values),
  }
}
