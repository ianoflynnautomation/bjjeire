import { http, HttpResponse } from 'msw'
import { API_ROUTES } from '@/config/api-routes'
import {
  createPaginatedTournaments,
  createTournament,
  createTournamentSummary,
} from '../../factories/tournament.factory'
import { createPaginatedAdminRegistrations } from '../../factories/registration.factory'

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
  // The organiser's sign-up list: empty unless a test seeds one.
  http.get(`*${API_ROUTES.tournaments}/:id/registration`, () =>
    HttpResponse.json(createPaginatedAdminRegistrations([]))
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
