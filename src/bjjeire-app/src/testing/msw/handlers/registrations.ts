import { http, HttpResponse } from 'msw'
import { API_ROUTES } from '@/config/api-routes'

/** No sign-ups and empty competitor lists, unless a test seeds them. */
export const registrationsHandlers = [
  http.get(`*${API_ROUTES.tournaments}/:id/competitor`, () =>
    HttpResponse.json([])
  ),
  http.get(`*${API_ROUTES.registration}/me`, () => HttpResponse.json([])),
]
