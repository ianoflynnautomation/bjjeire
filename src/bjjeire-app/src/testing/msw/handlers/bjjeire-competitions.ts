import { http, HttpResponse } from 'msw'
import { API_ROUTES } from '@/config/api-routes'
import {
  createPaginatedBjjEireCompetitions,
  createBjjEireCompetition,
  createBjjEireCompetitionSummary,
} from '../../factories/bjjeire-competition.factory'
import { createPaginatedAdminRegistrations } from '../../factories/registration.factory'

export const bjjEireCompetitionsHandlers = [
  // Registered before the slug route: `admin` is not a slug.
  http.get(`*${API_ROUTES.bjjEireCompetitionsAdmin}`, () =>
    HttpResponse.json(
      createPaginatedBjjEireCompetitions(
        [createBjjEireCompetitionSummary({ status: 'DRAFT' })],
        1,
        1
      )
    )
  ),
  http.get(`*${API_ROUTES.bjjEireCompetitionsAdmin}/:id`, ({ params }) =>
    HttpResponse.json(
      createBjjEireCompetition({ id: String(params.id), status: 'DRAFT' })
    )
  ),
  // The organiser's sign-up list: empty unless a test seeds one.
  http.get(`*${API_ROUTES.bjjEireCompetitions}/:id/registration`, () =>
    HttpResponse.json(createPaginatedAdminRegistrations([]))
  ),
  http.get(`*${API_ROUTES.bjjEireCompetitions}`, () =>
    HttpResponse.json(
      createPaginatedBjjEireCompetitions(
        [createBjjEireCompetitionSummary()],
        1,
        1
      )
    )
  ),
  http.get(`*${API_ROUTES.bjjEireCompetitions}/:slug`, ({ params }) =>
    HttpResponse.json(createBjjEireCompetition({ slug: String(params.slug) }))
  ),
]
