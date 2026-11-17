import { describe, it, expect } from 'vitest'
import {
  toRecordResultCommand,
  toResultFormValues,
} from '../division-result-form'

const A = 'aaaaaaaaaaaaaaaaaaaaaaa1'
const B = 'aaaaaaaaaaaaaaaaaaaaaaa2'
const C = 'aaaaaaaaaaaaaaaaaaaaaaa3'

describe('division result form', () => {
  it('fills the form from a recorded result, and leaves it empty without one', () => {
    expect(
      toResultFormValues({
        goldRegistrationId: A,
        silverRegistrationId: null,
        bronzeRegistrationIds: [B],
      })
    ).toEqual({ gold: A, silver: '', bronzes: [B, ''] })
    expect(toResultFormValues(null)).toEqual({
      gold: '',
      silver: '',
      bronzes: ['', ''],
    })
  })

  it('builds the command, sending no empty silver or bronze', () => {
    expect(
      toRecordResultCommand({ gold: A, silver: '', bronzes: ['', C] })
    ).toEqual({
      command: {
        goldRegistrationId: A,
        silverRegistrationId: null,
        bronzeRegistrationIds: [C],
      },
    })
  })

  it('needs a gold medallist', () => {
    expect(
      toRecordResultCommand({ gold: '', silver: B, bronzes: ['', ''] })
    ).toEqual({ error: 'needsGold' })
  })

  it('refuses the same competitor twice on one podium', () => {
    expect(
      toRecordResultCommand({ gold: A, silver: A, bronzes: ['', ''] })
    ).toEqual({ error: 'duplicate' })
    expect(
      toRecordResultCommand({ gold: A, silver: B, bronzes: [C, C] })
    ).toEqual({ error: 'duplicate' })
  })
})
