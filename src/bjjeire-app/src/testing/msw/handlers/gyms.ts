import { http, HttpResponse } from 'msw'
import { API_ROUTES } from '@/config/api-routes'
import { createGym, createPaginatedGyms } from '../../factories/gym.factory'

export const gymsHandlers = [
  http.get(`*${API_ROUTES.gyms}`, () =>
    HttpResponse.json(createPaginatedGyms([createGym()], 1, 1))
  ),
]
