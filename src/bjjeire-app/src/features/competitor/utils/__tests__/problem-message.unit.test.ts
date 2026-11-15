import { AxiosError, AxiosHeaders } from 'axios'
import { describe, it, expect } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { competitorProblemMessage } from '../problem-message'

function refused(status: number, data: unknown): AxiosError {
  return new AxiosError('refused', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  })
}

describe('competitorProblemMessage', () => {
  it('given a validation problem, when it is shown, then each field message is named rather than the generic detail', () => {
    const message = competitorProblemMessage(
      refused(400, {
        detail: 'One or more validation errors occurred.',
        errors: [
          {
            field: 'Academy.GymId',
            message: 'There is no gym with this id in the directory.',
          },
        ],
      })
    )

    expect(message).toBe(
      `${uiContent.competitor.form.academy}: There is no gym with this id in the directory.`
    )
  })

  it('given two generic field errors, when they are shown, then each names its field', () => {
    const message = competitorProblemMessage(
      refused(400, {
        errors: [
          { field: 'FirstName', message: 'must not be blank' },
          { field: 'Address.Country', message: 'must be an ISO code' },
        ],
      })
    )

    expect(message).toBe(
      `${uiContent.competitor.form.firstName}: must not be blank. ${uiContent.competitor.form.country}: must be an ISO code.`
    )
  })

  it('given a conflict, when it is shown, then the API detail is used', () => {
    expect(competitorProblemMessage(refused(409, { detail: 'Cancel first.' }))).toBe(
      'Cancel first.'
    )
  })

  it('given a 401, when it is shown, then the competitor is told their sign-in is no longer accepted', () => {
    expect(competitorProblemMessage(refused(401, {}))).toBe(
      uiContent.competitor.errors.signedOut
    )
  })
})
