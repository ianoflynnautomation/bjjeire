import { Suspense } from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { AppRoutes } from '@/App'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { BjjEireCompetitionPageTestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import { uiContent } from '@/config/ui-content'
import {
  loadFeatureFlags,
  type FeatureFlagsMap,
} from '@/features/feature-flags'
import { server } from '@/testing/msw/server'
import { RETIRED_NAME } from '@/testing/retired-name'
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
  BjjEireCompetitions: false,
}

// The first render of a lazy page waits for its chunk, which can pass the 1 s default on a busy run.
const LAZY_PAGE = { timeout: 5000 }

const BJJEIRE_COMPETITION_ROUTES = [
  paths.bjjEireCompetition.getHref('bjjeire'),
  paths.bjjEireCompetitionSignUp.getHref('bjjeire'),
  paths.bjjEireCompetitionSignUpComplete.getHref(
    'bjjeire',
    '0123456789abcdef01234567'
  ),
  paths.adminBjjEireCompetitions.path,
  paths.adminBjjEireCompetition.getHref('0123456789abcdef01234567'),
  paths.accountProfile.path,
  paths.accountSignUps.path,
]

describe('AppRoutes: BJJ Éire competitions', () => {
  // #5038, #3014
  it.each(BJJEIRE_COMPETITION_ROUTES)(
    'given the BjjEireCompetitions flag is off, when a visitor opens %s, then they are redirected to About and no BJJ Éire competition request is made',
    async route => {
      const requested = vi.fn()
      server.use(
        http.get(`*${API_ROUTES.bjjEireCompetitions}*`, () => {
          requested()
          return HttpResponse.json(null, { status: 404 })
        }),
        http.get(`*${API_ROUTES.competitor}*`, () => {
          requested()
          return HttpResponse.json(null, { status: 404 })
        })
      )

      renderAppRoutes(route, ALL_OFF)

      expect(
        await screen.findByRole(
          'heading',
          { level: 1, name: uiContent.about.title },
          LAZY_PAGE
        )
      ).toBeInTheDocument()
      expect(requested).not.toHaveBeenCalled()
    }
  )

  // #3014: the directory keeps working with the BJJ Éire switch off.
  it('given Competitions on and BjjEireCompetitions off, when a visitor opens /competitions, then the directory listing is shown', async () => {
    renderAppRoutes(paths.competitions.path, { ...ALL_OFF, Competitions: true })

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: uiContent.competitions.pageTitle.all },
        LAZY_PAGE
      )
    ).toBeInTheDocument()
  })

  // #3009
  it('given the BjjEireCompetitions flag is on, when a visitor opens /competitions/{slug}, then that BJJ Éire competition is shown', async () => {
    renderAppRoutes(paths.bjjEireCompetition.getHref('bjjeire'), {
      ...ALL_OFF,
      BjjEireCompetitions: true,
    })

    expect(
      await screen.findByTestId(
        BjjEireCompetitionPageTestIds.NAME,
        {},
        LAZY_PAGE
      )
    ).toBeInTheDocument()
  })

  // #3015
  it('given Competitions off and BjjEireCompetitions on, when a visitor opens /competitions, then the listing is unavailable and they land on About', async () => {
    renderAppRoutes(paths.competitions.path, {
      ...ALL_OFF,
      BjjEireCompetitions: true,
    })

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: uiContent.about.title },
        LAZY_PAGE
      )
    ).toBeInTheDocument()
  })

  // #3015: the sign-up and organiser screens do not depend on the directory switch.
  it.each([
    paths.bjjEireCompetitionSignUp.getHref('bjjeire'),
    paths.adminBjjEireCompetitions.path,
  ])(
    'given Competitions off and BjjEireCompetitions on, when a visitor opens %s, then they are not sent to About',
    async route => {
      renderAppRoutes(route, { ...ALL_OFF, BjjEireCompetitions: true })

      // Both pages render a level-1 heading of their own once their chunk loads.
      const heading = await screen.findByRole(
        'heading',
        { level: 1 },
        LAZY_PAGE
      )
      expect(heading).not.toHaveTextContent(uiContent.about.title)
    }
  )

  // #3015
  it('given Competitions off and BjjEireCompetitions on, when a visitor opens My sign-ups, then the page is shown', async () => {
    renderAppRoutes(paths.accountSignUps.path, {
      ...ALL_OFF,
      BjjEireCompetitions: true,
    })

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: uiContent.registrations.mine.heading },
        LAZY_PAGE
      )
    ).toBeInTheDocument()
  })

  // #3016: the old addresses are unknown addresses, handled like any other.
  it.each([
    `/${RETIRED_NAME}s`,
    `/${RETIRED_NAME}s/acceptance-open`,
    `/${RETIRED_NAME}s/acceptance-open/signup`,
    `/admin/${RETIRED_NAME}s`,
    `/admin/${RETIRED_NAME}s/0123456789abcdef01234567`,
  ])(
    'given Gyms, Competitions and BjjEireCompetitions on, when a visitor opens the retired address %s, then they land on the default page with no redirect to Competitions and no BJJ Éire competition request',
    async route => {
      const requested = vi.fn()
      server.use(
        http.get(`*${API_ROUTES.bjjEireCompetitions}/*`, () => {
          requested()
          return HttpResponse.json(null, { status: 404 })
        })
      )

      // Gyms comes first, so the default landing page is /gyms: a redirect
      // to /competitions (or a BJJ Éire competition page) would fail here.
      renderAppRoutes(route, {
        ...ALL_OFF,
        Gyms: true,
        Competitions: true,
        BjjEireCompetitions: true,
      })

      expect(
        await screen.findByRole(
          'heading',
          { level: 2, name: uiContent.gyms.pageTitle.all },
          { timeout: 10_000 }
        )
      ).toBeInTheDocument()
      expect(requested).not.toHaveBeenCalled()
    },
    15_000
  )
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
