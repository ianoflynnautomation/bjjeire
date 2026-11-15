import { http, HttpResponse } from 'msw'
import { API_ROUTES } from '@/config/api-routes'
import { createCompetitorHistory } from '../../factories/competitor.factory'

/** A signed-in competitor with no profile yet and no medals. */
export const competitorHandlers = [
  http.get(`*${API_ROUTES.competitor}/me/history`, () =>
    HttpResponse.json(createCompetitorHistory())
  ),
  http.get(`*${API_ROUTES.competitor}/me`, () =>
    HttpResponse.json(
      {
        type: 'urn:bjjeire:not-found',
        title: 'Resource Not Found',
        status: 404,
      },
      { status: 404 }
    )
  ),
]
