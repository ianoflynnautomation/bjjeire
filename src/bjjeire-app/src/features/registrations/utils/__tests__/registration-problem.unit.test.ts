import { AxiosError, AxiosHeaders } from 'axios'
import { describe, it, expect } from 'vitest'
import { uiContent } from '@/config/ui-content'
import {
  registrationProblemMessage,
  registrationProblemType,
} from '../registration-problem'

const { problems } = uiContent.registrations

function refused(status: number, type?: string): AxiosError {
  const headers = new AxiosHeaders()
  return new AxiosError('refused', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers,
    config: { headers },
    data: type ? { type, status, detail: 'from the API' } : {},
  })
}

describe('registrationProblemMessage', () => {
  it.each([
    ['urn:bjjeire:competition-full', problems['urn:bjjeire:competition-full']],
    ['urn:bjjeire:under-18', problems['urn:bjjeire:under-18']],
    ['urn:bjjeire:too-many-unpaid', problems['urn:bjjeire:too-many-unpaid']],
    [
      'urn:bjjeire:already-registered',
      problems['urn:bjjeire:already-registered'],
    ],
  ])(
    'given a %s refusal, when it is shown, then the competitor reads why',
    (type, message) => {
      expect(registrationProblemMessage(refused(409, type))).toBe(message)
      expect(registrationProblemType(refused(409, type))).toBe(type)
    }
  )

  it('given an unknown problem or a network failure, when it is shown, then a generic message appears', () => {
    expect(registrationProblemMessage(refused(500))).toBe(problems.fallback)
    expect(registrationProblemMessage(new Error('offline'))).toBe(
      problems.fallback
    )
    expect(registrationProblemType(new Error('offline'))).toBeNull()
  })
})
