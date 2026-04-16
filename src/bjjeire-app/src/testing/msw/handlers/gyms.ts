import { http, HttpResponse } from 'msw'
import { createGym, createPaginatedGyms } from '../../factories/gym.factory'

export const gymsHandlers = [
  http.get('*/api/gym', () =>
    HttpResponse.json(createPaginatedGyms([createGym()], 1, 1))
  ),
]
