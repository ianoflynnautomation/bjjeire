import { http, HttpResponse } from 'msw'

export const optionsPassthrough = http.options(
  '*',
  () => new HttpResponse(null, { status: 204 })
)

export const sharedHandlers = [optionsPassthrough]
