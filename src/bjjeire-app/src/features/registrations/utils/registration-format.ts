import { uiContent } from '@/config/ui-content'
import type { DivisionDto } from '@/types/tournaments'

const { disciplines, genders, ageCategories, belts } = uiContent.registrations

/** "Gi · Male · Adult · White · -76 kg" */
export function divisionLabel(division: DivisionDto): string {
  return [
    disciplines[division.discipline],
    genders[division.gender],
    ageCategories[division.ageCategory],
    belts[division.belt],
    division.weightClass,
  ].join(' · ')
}
