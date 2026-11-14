import { http, HttpResponse } from 'msw'
import { API_ROUTES } from '@/config/api-routes'
import {
  createPaginatedTournaments,
  createTournament,
  createTournamentSummary,
} from '../../factories/tournament.factory'

export const tournamentsHandlers = [
  // Registered before the slug route: `admin` is not a slug.
  http.get(`*${API_ROUTES.tournamentsAdmin}`, () =>
    HttpResponse.json(
      createPaginatedTournaments(
        [createTournamentSummary({ status: 'DRAFT' })],
        1,
        1
      )
    )
  ),
  http.get(`*${API_ROUTES.tournamentsAdmin}/:id`, ({ params }) =>
    HttpResponse.json(
      createTournament({ id: String(params.id), status: 'DRAFT' })
    )
  ),
  http.get(`*${API_ROUTES.tournaments}`, () =>
    HttpResponse.json(
      createPaginatedTournaments([createTournamentSummary()], 1, 1)
    )
  ),
  http.get(`*${API_ROUTES.tournaments}/:slug`, ({ params }) =>
    HttpResponse.json(createTournament({ slug: String(params.slug) }))
  ),
]
