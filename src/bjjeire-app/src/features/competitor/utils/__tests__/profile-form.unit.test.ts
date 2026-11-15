import { describe, it, expect } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { createCompetitor } from '@/testing/factories/competitor.factory'
import {
  emptyProfileForm,
  profileFormFrom,
  toSaveCompetitorCommand,
  validateProfileForm,
  type ProfileFormValues,
} from '../profile-form'

const { validation } = uiContent.competitor
const TODAY = '2026-11-15'

function filled(overrides: Partial<ProfileFormValues> = {}): ProfileFormValues {
  return {
    ...emptyProfileForm(),
    firstName: 'Aoife',
    lastName: 'Byrne',
    nationality: 'IE',
    dateOfBirth: '1990-04-12',
    gender: 'FEMALE',
    belt: 'BLUE',
    academyMode: 'typed',
    academyName: 'Team X',
    ...overrides,
  }
}

describe('profile form', () => {
  // #5007
  it('given every required detail, when validated, then there are no errors', () => {
    expect(validateProfileForm(filled(), TODAY)).toEqual({})
  })

  it('given an empty form, when validated, then names, nationality, date of birth, gender and belt are asked for', () => {
    const errors = validateProfileForm(emptyProfileForm(), TODAY)

    expect(errors).toMatchObject({
      firstName: validation.firstNameRequired,
      lastName: validation.lastNameRequired,
      nationality: validation.nationalityRequired,
      dateOfBirth: validation.dateOfBirthRequired,
      gender: validation.genderRequired,
      belt: validation.beltRequired,
    })
  })

  it('given a date of birth of today, when validated, then it must be in the past', () => {
    expect(validateProfileForm(filled({ dateOfBirth: TODAY }), TODAY)).toEqual({
      dateOfBirth: validation.dateOfBirthPast,
    })
  })

  it('given names over 60 and teams over 80 characters, when validated, then each is refused', () => {
    const errors = validateProfileForm(
      filled({
        firstName: 'a'.repeat(61),
        middleName: 'a'.repeat(61),
        academyName: 'a'.repeat(81),
        affiliation: 'a'.repeat(81),
      }),
      TODAY
    )

    expect(errors).toEqual({
      firstName: validation.nameTooLong,
      middleName: validation.nameTooLong,
      academyName: validation.teamTooLong,
      affiliation: validation.teamTooLong,
    })
  })

  // #5008
  it('given each academy choice, when validated, then a directory gym or a typed name is needed, and none needs nothing', () => {
    expect(
      validateProfileForm(filled({ academyMode: 'directory' }), TODAY)
    ).toEqual({ academyGymId: validation.academyGymRequired })
    expect(validateProfileForm(filled({ academyName: '  ' }), TODAY)).toEqual({
      academyName: validation.academyNameRequired,
    })
    expect(
      validateProfileForm(
        filled({ academyMode: 'none', academyName: '' }),
        TODAY
      )
    ).toEqual({})
  })

  it('given a phone with letters, when validated, then it is refused', () => {
    expect(validateProfileForm(filled({ phone: 'call me' }), TODAY)).toEqual({
      phone: validation.phoneInvalid,
    })
  })

  // #5008
  it('given each academy choice, when saved, then the command names the gym, the typed name, or no academy', () => {
    expect(
      toSaveCompetitorCommand(
        filled({
          academyMode: 'directory',
          academyGymId: 'gym-1',
          academyName: 'Directory Gym',
        })
      ).academy
    ).toEqual({ gymId: 'gym-1' })
    expect(
      toSaveCompetitorCommand(filled({ academyName: '  My Garage ' })).academy
    ).toEqual({ name: 'My Garage' })
    expect(
      toSaveCompetitorCommand(filled({ academyMode: 'none' })).academy
    ).toBeNull()
  })

  it('given empty optional fields, when saved, then they are sent as null and an empty address is left out', () => {
    const command = toSaveCompetitorCommand(
      filled({ middleName: ' ', affiliation: '', phone: '' })
    )

    expect(command).toMatchObject({
      firstName: 'Aoife',
      middleName: null,
      affiliation: null,
      phone: null,
      address: null,
    })
  })

  it('given a saved profile, when the form opens, then it shows the saved values and how the academy was chosen', () => {
    expect(
      profileFormFrom(
        createCompetitor({ academy: { gymId: 'gym-1', name: 'Directory Gym' } })
      )
    ).toMatchObject({
      firstName: 'Aoife',
      academyMode: 'directory',
      academyGymId: 'gym-1',
      academyName: 'Directory Gym',
      affiliation: 'Alliance',
    })
    expect(profileFormFrom(createCompetitor({ academy: null }))).toMatchObject({
      academyMode: 'none',
      academyName: '',
    })
  })
})
