import { describe, it, expect } from 'vitest'
import {
  addDivisions,
  generateDivisions,
  isSelectionComplete,
  parseWeightClasses,
  type DivisionSelection,
} from '../division-generator'

const selection = (
  overrides: Partial<DivisionSelection> = {}
): DivisionSelection => ({
  disciplines: ['GI'],
  genders: ['MALE'],
  ageCategories: ['ADULT'],
  belts: ['WHITE'],
  weightClasses: '-76 kg',
  ...overrides,
})

describe('parseWeightClasses', () => {
  it('given a comma or line separated list, then labels are trimmed and blanks dropped', () => {
    expect(parseWeightClasses(' -70 kg, -76 kg ,,\n-82.3 kg ')).toEqual([
      '-70 kg',
      '-76 kg',
      '-82.3 kg',
    ])
  })

  it('given the same label twice in different case or spacing, then it is kept once', () => {
    expect(parseWeightClasses('-76 kg, -76 KG,  -76 kg')).toEqual(['-76 kg'])
  })
})

describe('generateDivisions', () => {
  it('given several choices in every group, then one division is produced for every combination', () => {
    const divisions = generateDivisions(
      selection({
        disciplines: ['GI', 'NO_GI'],
        genders: ['MALE', 'FEMALE'],
        ageCategories: ['ADULT', 'MASTER_1'],
        belts: ['WHITE', 'BLUE', 'PURPLE'],
        weightClasses: '-70 kg, -76 kg',
      })
    )

    expect(divisions).toHaveLength(2 * 2 * 2 * 3 * 2)
    expect(new Set(divisions.map(d => JSON.stringify(d))).size).toBe(48)
    expect(divisions[0]).toEqual({
      discipline: 'GI',
      gender: 'MALE',
      ageCategory: 'ADULT',
      belt: 'WHITE',
      weightClass: '-70 kg',
    })
    expect(divisions.every(d => d.id === undefined)).toBe(true)
  })

  it.each([
    ['disciplines', { disciplines: [] }],
    ['genders', { genders: [] }],
    ['age categories', { ageCategories: [] }],
    ['belts', { belts: [] }],
    ['weight classes', { weightClasses: ' , ' }],
  ] as const)(
    'given nothing chosen for %s, then the selection is incomplete and produces nothing',
    (_group, overrides) => {
      const incomplete = selection(overrides as Partial<DivisionSelection>)

      expect(isSelectionComplete(incomplete)).toBe(false)
      expect(generateDivisions(incomplete)).toEqual([])
    }
  )
})

describe('addDivisions', () => {
  it('given generated divisions the tournament already has, then only the new ones are appended and saved ids are kept', () => {
    const existing = [
      { ...generateDivisions(selection())[0], id: 'saved-division' },
    ]

    const merged = addDivisions(
      existing,
      generateDivisions(selection({ weightClasses: '-76 KG, -82 kg' }))
    )

    expect(merged).toHaveLength(2)
    expect(merged[0].id).toBe('saved-division')
    expect(merged[1]).toMatchObject({ weightClass: '-82 kg' })
  })
})
