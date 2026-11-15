import { describe, it, expect } from 'vitest'
import { uiContent } from '@/config/ui-content'
import {
  createDivision,
  createTournament,
} from '@/testing/factories/tournament.factory'
import {
  emptyTournamentForm,
  parseEuroToCents,
  toCommand,
  toFormValues,
  validateTournamentForm,
  type TournamentFormValues,
} from '../tournament-form'

const { validation } = uiContent.tournamentAdmin

const valid = (
  overrides: Partial<TournamentFormValues> = {}
): TournamentFormValues => ({
  name: 'BjjEire',
  slug: 'bjjeire',
  description: '',
  date: '2026-06-27',
  venueName: 'National Arena',
  venueAddress: '1 Main Street',
  entryFee: '25',
  opensAt: '2026-06-01T10:00',
  closesAt: '2026-06-20T21:00',
  competitorLimit: '',
  ...overrides,
})

describe('parseEuroToCents', () => {
  it.each([
    ['25', 2500],
    ['25.5', 2550],
    ['25.50', 2550],
    ['0', 0],
    [' 19.99 ', 1999],
    ['0.07', 7],
  ])('given "%s" euro, then it is %i cents', (text, cents) => {
    expect(parseEuroToCents(text)).toBe(cents)
  })

  it.each(['', '-1', '25.555', 'abc', '1,50', '€25'])(
    'given "%s", then it is not a fee',
    text => {
      expect(parseEuroToCents(text)).toBeNull()
    }
  )
})

describe('validateTournamentForm', () => {
  it('given complete, sensible values, then there are no errors', () => {
    expect(validateTournamentForm(valid())).toEqual({})
  })

  it('given an empty form, then every required field is reported', () => {
    expect(validateTournamentForm(emptyTournamentForm())).toEqual({
      name: validation.nameRequired,
      slug: validation.slugRequired,
      date: validation.dateRequired,
      venueName: validation.venueNameRequired,
      entryFee: validation.feeInvalid,
      opensAt: validation.opensAtRequired,
      closesAt: validation.closesAtRequired,
    })
  })

  it.each([
    [{ name: 'n'.repeat(121) }, 'name', validation.nameTooLong],
    [{ slug: 'BjjEire' }, 'slug', validation.slugInvalid],
    [{ slug: 'bjj--eire' }, 'slug', validation.slugInvalid],
    [{ slug: 'admin' }, 'slug', validation.slugReserved],
    [
      { description: 'd'.repeat(4001) },
      'description',
      validation.descriptionTooLong,
    ],
    [{ venueName: 'v'.repeat(101) }, 'venueName', validation.venueNameTooLong],
    [
      { venueAddress: 'a'.repeat(201) },
      'venueAddress',
      validation.venueAddressTooLong,
    ],
    [{ entryFee: '-5' }, 'entryFee', validation.feeInvalid],
    [{ closesAt: '2026-06-01T10:00' }, 'closesAt', validation.windowOrder],
    [{ closesAt: '2026-06-28T00:01' }, 'closesAt', validation.windowAfterDay],
    [{ competitorLimit: '0' }, 'competitorLimit', validation.limitInvalid],
    [{ competitorLimit: '1.5' }, 'competitorLimit', validation.limitInvalid],
  ] as const)('given %o, then %s is reported', (overrides, field, message) => {
    expect(validateTournamentForm(valid(overrides))).toEqual({
      [field]: message,
    })
  })

  it('given registration closes exactly at the end of the tournament day, then it is accepted', () => {
    expect(
      validateTournamentForm(valid({ closesAt: '2026-06-28T00:00' }))
    ).toEqual({})
  })
})

describe('toCommand', () => {
  it('given form values, then money is cents, times are UTC instants and blanks are null', () => {
    const divisions = [createDivision({ id: 'kept' })]

    expect(
      toCommand(valid({ name: '  BjjEire  ', entryFee: '25.50' }), divisions)
    ).toEqual({
      slug: 'bjjeire',
      name: 'BjjEire',
      description: null,
      date: '2026-06-27',
      venue: { venue: 'National Arena', address: '1 Main Street' },
      entryFeeCents: 2550,
      registrationOpensAt: '2026-06-01T09:00:00.000Z',
      registrationClosesAt: '2026-06-20T20:00:00.000Z',
      competitorLimit: null,
      divisions,
    })
  })

  it('given a limit and an existing venue with coordinates, then both are carried', () => {
    const coordinates = { type: 'Point', coordinates: [-6.26, 53.35] } as const
    const command = toCommand(valid({ competitorLimit: '200' }), [], {
      venue: 'Old name',
      address: 'Old address',
      coordinates: { ...coordinates, coordinates: [-6.26, 53.35] },
    })

    expect(command.competitorLimit).toBe(200)
    expect(command.venue).toEqual({
      venue: 'National Arena',
      address: '1 Main Street',
      coordinates: { type: 'Point', coordinates: [-6.26, 53.35] },
    })
  })
})

describe('toFormValues', () => {
  it('given a tournament from the API, then the form shows euro and Irish wall-clock times', () => {
    expect(
      toFormValues(
        createTournament({
          name: 'BjjEire',
          slug: 'bjjeire',
          description: null,
          entryFeeCents: 2550,
          competitorLimit: 200,
        })
      )
    ).toEqual({
      name: 'BjjEire',
      slug: 'bjjeire',
      description: '',
      date: '2026-06-27',
      venueName: 'National Arena',
      venueAddress: '1 Main Street, Dublin',
      entryFee: '25.50',
      opensAt: '2026-06-01T10:00',
      closesAt: '2026-06-20T21:00',
      competitorLimit: '200',
    })
  })
})
