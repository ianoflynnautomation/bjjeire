import { http, HttpResponse } from 'msw'
import {
  createCompetition,
  createPaginatedCompetitions,
} from '../../factories/competition.factory'

export const competitionsHandlers = [
  http.get('*/api/competition', () =>
    HttpResponse.json(createPaginatedCompetitions([createCompetition()], 1, 1))
  ),
]
