import { http, HttpResponse } from 'msw'
import { API_ROUTES } from '@/config/api-routes'
import {
  createEvent,
  createPaginatedEvents,
} from '../../factories/event.factory'

export const bjjEventsHandlers = [
  http.get(`*${API_ROUTES.bjjEvents}`, () =>
    HttpResponse.json(createPaginatedEvents([createEvent()], 1, 1))
  ),
]
