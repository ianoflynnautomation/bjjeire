import { http, HttpResponse } from 'msw'
import { API_ROUTES } from '@/config/api-routes'
import {
  createCompetition,
  createPaginatedCompetitions,
} from '../../factories/competition.factory'

export const competitionsHandlers = [
  http.get(`*${API_ROUTES.competitions}`, () =>
    HttpResponse.json(createPaginatedCompetitions([createCompetition()], 1, 1))
  ),
]
