import {
  AGE_CATEGORIES,
  BELTS,
  DISCIPLINES,
  GENDERS,
  type AgeCategory,
  type Belt,
  type Discipline,
  type DivisionDto,
  type Gender,
} from '@/types/tournaments'

export interface DivisionSelection {
  disciplines: Discipline[]
  genders: Gender[]
  ageCategories: AgeCategory[]
  belts: Belt[]
  /** Free text: labels separated by commas or new lines. */
  weightClasses: string
}

export const emptyDivisionSelection: DivisionSelection = {
  disciplines: [],
  genders: [],
  ageCategories: [],
  belts: [],
  weightClasses: '',
}

const normalise = (label: string): string => label.trim().toLowerCase()

export function parseWeightClasses(text: string): string[] {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const raw of text.split(/[,\n]/u)) {
    const label = raw.trim().replaceAll(/\s+/gu, ' ')
    if (label !== '' && !seen.has(normalise(label))) {
      seen.add(normalise(label))
      labels.push(label)
    }
  }
  return labels
}

export function isSelectionComplete(selection: DivisionSelection): boolean {
  return (
    selection.disciplines.length > 0 &&
    selection.genders.length > 0 &&
    selection.ageCategories.length > 0 &&
    selection.belts.length > 0 &&
    parseWeightClasses(selection.weightClasses).length > 0
  )
}

/** One division for every combination of the ticked options, in the catalogue's order. */
export function generateDivisions(selection: DivisionSelection): DivisionDto[] {
  const weightClasses = parseWeightClasses(selection.weightClasses)
  const divisions: DivisionDto[] = []
  for (const discipline of DISCIPLINES.filter(d =>
    selection.disciplines.includes(d)
  )) {
    for (const gender of GENDERS.filter(g => selection.genders.includes(g))) {
      for (const ageCategory of AGE_CATEGORIES.filter(a =>
        selection.ageCategories.includes(a)
      )) {
        for (const belt of BELTS.filter(b => selection.belts.includes(b))) {
          for (const weightClass of weightClasses) {
            divisions.push({
              discipline,
              gender,
              ageCategory,
              belt,
              weightClass,
            })
          }
        }
      }
    }
  }
  return divisions
}

/** The API's own test for "the same division": the five values, weight class without case or outer spaces. */
export function divisionKey(division: DivisionDto): string {
  return [
    division.discipline,
    division.gender,
    division.ageCategory,
    division.belt,
    normalise(division.weightClass),
  ].join('|')
}

/** Appends the generated divisions the tournament does not have yet. Existing rows, and their ids, stay. */
export function addDivisions(
  existing: readonly DivisionDto[],
  generated: readonly DivisionDto[]
): DivisionDto[] {
  const keys = new Set(existing.map(divisionKey))
  const merged = [...existing]
  for (const division of generated) {
    if (!keys.has(divisionKey(division))) {
      keys.add(divisionKey(division))
      merged.push(division)
    }
  }
  return merged
}
