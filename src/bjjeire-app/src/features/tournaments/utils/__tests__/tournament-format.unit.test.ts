import { describe, it, expect } from 'vitest'
import {
  createDivision,
  createTournament,
} from '@/testing/factories/tournament.factory'
import {
  formatEntryFee,
  groupDivisions,
  registrationMessage,
} from '../tournament-format'

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
      registrationMessage(createTournament({ registrationState: 'NOT_OPEN' }))
    ).toBe('Registration opens on 1 June 2026, 10:00.')
  })

  // #5003
  it('given registration has closed, then the message says it is closed', () => {
    expect(
      registrationMessage(createTournament({ registrationState: 'CLOSED' }))
    ).toBe('Registration is closed.')
  })

  it('given registration is open, then the message says until when', () => {
    expect(
      registrationMessage(createTournament({ registrationState: 'OPEN' }))
    ).toBe('Registration is open until 20 June 2026, 21:00.')
  })

  it('given every place is taken, then the message says the tournament is full', () => {
    expect(
      registrationMessage(createTournament({ registrationState: 'FULL' }))
    ).toBe('This tournament is full.')
  })

  it.each([
    ['CANCELLED', 'This tournament has been cancelled.'],
    ['FINISHED', 'This tournament has finished.'],
  ] as const)(
    'given a %s tournament, then its status is the message',
    (status, expected) => {
      expect(
        registrationMessage(
          createTournament({ status, registrationState: 'CLOSED' })
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
