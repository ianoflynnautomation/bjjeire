import { http, HttpResponse } from 'msw'
import {
  createEvent,
  createPaginatedEvents,
} from '../../factories/event.factory'

export const bjjEventsHandlers = [
  http.get('*/api/v1/bjjevent', () =>
    HttpResponse.json(createPaginatedEvents([createEvent()], 1, 1))
  ),
]
