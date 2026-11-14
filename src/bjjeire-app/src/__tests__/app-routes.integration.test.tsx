import { Suspense } from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { AppRoutes } from '@/App'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { TournamentPageTestIds } from '@/constants/tournamentDataTestIds'
import { uiContent } from '@/config/ui-content'
import {
  loadFeatureFlags,
  type FeatureFlagsMap,
} from '@/features/feature-flags'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'

function renderAppRoutes(
  initialRoute: string,
  featureFlags?: FeatureFlagsMap
): void {
  renderWithProviders(
    <Suspense fallback={null}>
      <AppRoutes />
    </Suspense>,
    { initialRoutes: [initialRoute], featureFlags }
  )
}

const ALL_OFF: FeatureFlagsMap = {
  BjjEvents: false,
  Gyms: false,
  Competitions: false,
  Stores: false,
  GymsMap: false,
  EventsMap: false,
  Tournaments: false,
}

// The first render of a lazy page waits for its chunk, which can pass the 1 s default on a busy run.
const LAZY_PAGE = { timeout: 5000 }

describe('AppRoutes: tournaments', () => {
  // #5038
  it.each([
    paths.tournaments.path,
    paths.tournament.getHref('bjjeire'),
    paths.adminTournaments.path,
    paths.adminTournament.getHref('0123456789abcdef01234567'),
  ])(
    'given the Tournaments flag is off, when a visitor opens %s, then they are redirected to About and no tournament request is made',
    async route => {
      const requested = vi.fn()
      server.use(
        http.get(`*${API_ROUTES.tournaments}*`, () => {
          requested()
          return HttpResponse.json(null, { status: 404 })
        })
      )

      renderAppRoutes(route, ALL_OFF)

      expect(
        await screen.findByRole(
          'heading',
          {
            level: 1,
            name: uiContent.about.title,
          },
          LAZY_PAGE
        )
      ).toBeInTheDocument()
      expect(requested).not.toHaveBeenCalled()
    }
  )

  it('given the Tournaments flag is on, when a visitor opens /tournaments, then the tournament list is shown', async () => {
    renderAppRoutes(paths.tournaments.path, { ...ALL_OFF, Tournaments: true })

    expect(
      await screen.findByRole(
        'heading',
        {
          level: 1,
          name: uiContent.tournaments.pageTitle.all,
        },
        LAZY_PAGE
      )
    ).toBeInTheDocument()
  })

  it('given the Tournaments flag is on, when a visitor opens a tournament address, then that tournament is shown', async () => {
    renderAppRoutes(paths.tournament.getHref('bjjeire'), {
      ...ALL_OFF,
      Tournaments: true,
    })

    expect(
      await screen.findByTestId(TournamentPageTestIds.NAME, {}, LAZY_PAGE)
    ).toBeInTheDocument()
  })

  it('given only the Tournaments flag is on, when a visitor opens the home address, then they land on the tournament list, not a tournament or admin page', async () => {
    renderAppRoutes(paths.home.path, { ...ALL_OFF, Tournaments: true })

    expect(
      await screen.findByRole(
        'heading',
        {
          level: 1,
          name: uiContent.tournaments.pageTitle.all,
        },
        LAZY_PAGE
      )
    ).toBeInTheDocument()
  })
})

describe('AppRoutes', () => {
  it('given the Gyms flag is off, when a visitor opens /gyms, then they are redirected to About', async () => {
    renderAppRoutes(paths.gyms.path)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: uiContent.about.title,
      })
    ).toBeInTheDocument()
  })

  it('#1014: given the flag fetch fails, when a visitor opens a map link, then every flag is off and Gyms fails closed to About', async () => {
    server.use(
      http.get(`*${API_ROUTES.featureFlags}`, () =>
        HttpResponse.json(null, { status: 500 })
      )
    )
    const flags = await loadFeatureFlags()

    renderAppRoutes(`${paths.gyms.path}?view=map`, flags)

    expect(flags.Gyms).toBe(false)
    expect(flags.GymsMap).toBe(false)
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: uiContent.about.title,
      })
    ).toBeInTheDocument()
  })
})
