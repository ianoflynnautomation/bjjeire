import { uiContent } from '@/config/ui-content'
import {
  AGE_CATEGORIES,
  BELTS,
  DISCIPLINES,
  GENDERS,
  type DivisionDto,
  type RegistrationState,
  type BjjEireCompetitionStatus,
} from '@/types/bjjeire-competitions'
import { formatDublinDateTime } from '@/utils/dublin-time'

const { registration, details, disciplines, genders } =
  uiContent.bjjEireCompetitions

/** `€25.00` from 2500. Money is whole cents everywhere; only display divides. */
export function formatEntryFee(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(
    cents / 100
  )
}

interface RegistrationFacts {
  status: BjjEireCompetitionStatus
  registrationState: RegistrationState
  registrationOpensAt: string
  registrationClosesAt: string
}

/** One sentence telling a visitor whether they can sign up, and when. */
export function registrationMessage(
  bjjEireCompetition: RegistrationFacts
): string {
  if (bjjEireCompetition.status === 'CANCELLED') {
    return registration.cancelled
  }
  if (bjjEireCompetition.status === 'FINISHED') {
    return registration.finished
  }
  switch (bjjEireCompetition.registrationState) {
    case 'NOT_OPEN':
      return `${registration.opensOnPrefix} ${formatDublinDateTime(bjjEireCompetition.registrationOpensAt)} (${details.timeZoneNote}).`
    case 'OPEN':
      return `${registration.openUntilPrefix} ${formatDublinDateTime(bjjEireCompetition.registrationClosesAt)} (${details.timeZoneNote}).`
    case 'FULL':
      return registration.full
    case 'CLOSED':
      return registration.closed
  }
}

export interface DivisionGroup {
  key: string
  label: string
  divisions: DivisionDto[]
}

function compareWeightClass(a: string, b: string): number {
  return a.localeCompare(b, 'en', { numeric: true })
}

/** Divisions as the page lists them: a group per discipline and gender, each in a stable order. */
export function groupDivisions(
  divisions: readonly DivisionDto[]
): DivisionGroup[] {
  const groups: DivisionGroup[] = []
  for (const discipline of DISCIPLINES) {
    for (const gender of GENDERS) {
      const members = divisions
        .filter(
          division =>
            division.discipline === discipline && division.gender === gender
        )
        .sort(
          (a, b) =>
            AGE_CATEGORIES.indexOf(a.ageCategory) -
              AGE_CATEGORIES.indexOf(b.ageCategory) ||
            BELTS.indexOf(a.belt) - BELTS.indexOf(b.belt) ||
            compareWeightClass(a.weightClass, b.weightClass)
        )
      if (members.length > 0) {
        groups.push({
          key: `${discipline}-${gender}`,
          label: `${disciplines[discipline]} · ${genders[gender]}`,
          divisions: members,
        })
      }
    }
  }
  return groups
}
