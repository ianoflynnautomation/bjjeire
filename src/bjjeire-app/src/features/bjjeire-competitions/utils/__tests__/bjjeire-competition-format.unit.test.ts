import { describe, it, expect } from 'vitest'
import {
  createDivision,
  createBjjEireCompetition,
} from '@/testing/factories/bjjeire-competition.factory'
import {
  formatEntryFee,
  groupDivisions,
  registrationMessage,
} from '../bjjeire-competition-format'

describe('formatEntryFee', () => {
  it.each([
    [2500, '€25.00'],
    [2550, '€25.50'],
    [5, '€0.05'],
    [0, '€0.00'],
    [123456, '€1,234.56'],
  ])('given %i cents, then it shows %s', (cents, expected) => {
    expect(formatEntryFee(cents)).toBe(expected)
  })
})

describe('registrationMessage', () => {
  // #5003
  it('given registration has not opened, then the message says when it opens in Irish time', () => {
    expect(
      registrationMessage(
        createBjjEireCompetition({ registrationState: 'NOT_OPEN' })
      )
    ).toBe('Registration opens on 1 June 2026, 10:00.')
  })

  // #5003
  it('given registration has closed, then the message says it is closed', () => {
    expect(
      registrationMessage(
        createBjjEireCompetition({ registrationState: 'CLOSED' })
      )
    ).toBe('Registration is closed.')
  })

  it('given registration is open, then the message says until when', () => {
    expect(
      registrationMessage(
        createBjjEireCompetition({ registrationState: 'OPEN' })
      )
    ).toBe('Registration is open until 20 June 2026, 21:00.')
  })

  it('given every place is taken, then the message says the competition is full', () => {
    expect(
      registrationMessage(
        createBjjEireCompetition({ registrationState: 'FULL' })
      )
    ).toBe('This competition is full.')
  })

  it.each([
    ['CANCELLED', 'This competition has been cancelled.'],
    ['FINISHED', 'This competition has finished.'],
  ] as const)(
    'given a %s competition, then its status is the message',
    (status, expected) => {
      expect(
        registrationMessage(
          createBjjEireCompetition({ status, registrationState: 'CLOSED' })
        )
      ).toBe(expected)
    }
  )
})

describe('groupDivisions', () => {
  it('given mixed divisions, then they are grouped by discipline and gender in a fixed order', () => {
    const groups = groupDivisions([
      createDivision({ discipline: 'NO_GI', gender: 'FEMALE' }),
      createDivision({ discipline: 'GI', gender: 'FEMALE' }),
      createDivision({ discipline: 'GI', gender: 'MALE' }),
      createDivision({ discipline: 'GI', gender: 'MALE', belt: 'BLUE' }),
    ])

    expect(groups.map(group => group.label)).toEqual([
      'Gi · Male',
      'Gi · Female',
      'No-Gi · Female',
    ])
    expect(groups[0].divisions).toHaveLength(2)
  })

  it('given one group, then its divisions are ordered by age category, belt, then weight class', () => {
    const [group] = groupDivisions([
      createDivision({ ageCategory: 'MASTER_1', belt: 'WHITE' }),
      createDivision({ belt: 'BLUE', weightClass: '-82 kg' }),
      createDivision({ belt: 'BLUE', weightClass: '-76 kg' }),
      createDivision({ belt: 'WHITE', weightClass: '-100 kg' }),
    ])

    expect(
      group.divisions.map(d => `${d.ageCategory} ${d.belt} ${d.weightClass}`)
    ).toEqual([
      'ADULT WHITE -100 kg',
      'ADULT BLUE -76 kg',
      'ADULT BLUE -82 kg',
      'MASTER_1 WHITE -76 kg',
    ])
  })

  it('given no divisions, then there are no groups', () => {
    expect(groupDivisions([])).toEqual([])
  })
})
