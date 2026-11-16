import { screen, waitFor, within } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { http } from 'msw'
import { describe, it, expect, vi } from 'vitest'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import {
  BjjEireCompetitionCardTestIds,
  BjjEireCompetitionsFeaturedTestIds,
} from '@/constants/bjjEireCompetitionDataTestIds'
import { CompetitionsPageTestIds } from '@/constants/competitionDataTestIds'
import {
  BJJEIRE_COMPETITIONS_API,
  seedBjjEireCompetitions,
  seedBjjEireCompetitionsError,
  seedBjjEireCompetitionsPending,
} from '@/features/bjjeire-competitions/testing/bjjeire-competitions-test-helpers'
import {
  renderCompetitionsPage,
  seedCompetitions,
} from '@/features/competitions/testing/competitions-test-helpers'
import CompetitionsPage from '@/pages/CompetitionsPage'
import { createBjjEireCompetitionSummary } from '@/testing/factories/bjjeire-competition.factory'
import { createCompetition } from '@/testing/factories/competition.factory'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'

const { featured } = uiContent.bjjEireCompetitions
const ON = { BjjEireCompetitions: true }

function upcoming(): ReturnType<typeof createBjjEireCompetitionSummary>[] {
  // The API returns them earliest day first (R3); the page keeps that order.
  return [
    createBjjEireCompetitionSummary({
      name: 'BJJ Éire Spring Open',
      slug: 'spring-open',
      date: '2026-03-14',
      divisionCount: 4,
      entryFeeCents: 3000,
      registrationState: 'OPEN',
    }),
    createBjjEireCompetitionSummary({
      name: 'BJJ Éire Summer Open',
      slug: 'summer-open',
      date: '2026-06-27',
      divisionCount: 1,
      registrationState: 'NOT_OPEN',
    }),
  ]
}

async function findFeatured(): Promise<HTMLElement> {
  return screen.findByTestId(
    BjjEireCompetitionsFeaturedTestIds.FEATURED_SECTION
  )
}

describe('CompetitionsPage: featured BJJ Éire competitions', () => {
  // #3006
  it('given two upcoming BJJ Éire competitions, when a visitor opens Competitions, then a featured section above the search box shows each one earliest first with its day, venue, fee, divisions and registration state', async () => {
    seedBjjEireCompetitions(upcoming())
    seedCompetitions([createCompetition({ name: 'NAGA Ireland' })])
    renderCompetitionsPage(ON)

    const section = await findFeatured()
    expect(
      within(section).getByRole('heading', { level: 2, name: featured.heading })
    ).toBeInTheDocument()
    const cards = within(section).getAllByTestId(
      BjjEireCompetitionsFeaturedTestIds.FEATURED_CARD
    )
    expect(
      cards.map(
        card =>
          within(card).getByTestId(BjjEireCompetitionCardTestIds.NAME)
            .textContent
      )
    ).toEqual(['BJJ Éire Spring Open', 'BJJ Éire Summer Open'])
    const first = within(cards[0])
    expect(
      first.getByTestId(BjjEireCompetitionCardTestIds.DATE)
    ).toHaveTextContent('2026')
    expect(
      first.getByTestId(BjjEireCompetitionCardTestIds.VENUE)
    ).toBeInTheDocument()
    expect(
      first.getByTestId(BjjEireCompetitionCardTestIds.FEE)
    ).toHaveTextContent('€30.00')
    expect(
      first.getByTestId(BjjEireCompetitionCardTestIds.DIVISION_COUNT)
    ).toHaveTextContent('4')
    expect(
      first.getByTestId(BjjEireCompetitionCardTestIds.STATE)
    ).toBeInTheDocument()

    // Above the search box, in document order.
    const search = await screen.findByTestId(CompetitionsPageTestIds.SEARCH)
    expect(
      section.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  // #3007
  it('given no upcoming BJJ Éire competition, when a visitor opens Competitions, then there is no featured section and no placeholder', async () => {
    seedBjjEireCompetitions([])
    seedCompetitions([createCompetition({ name: 'NAGA Ireland' })])
    renderCompetitionsPage(ON)

    expect(await screen.findByText('NAGA Ireland')).toBeInTheDocument()
    expect(
      screen.queryByTestId(BjjEireCompetitionsFeaturedTestIds.FEATURED_SECTION)
    ).not.toBeInTheDocument()
    expect(screen.queryByText(featured.heading)).not.toBeInTheDocument()
  })

  // #3007, #3014
  it('given the BjjEireCompetitions flag is off, when a visitor opens Competitions, then no BJJ Éire competition is requested and the listing shows as before', async () => {
    const requested = vi.fn()
    server.use(
      http.get(BJJEIRE_COMPETITIONS_API, () => {
        requested()
      })
    )
    seedCompetitions([createCompetition({ name: 'NAGA Ireland' })])
    renderCompetitionsPage({ BjjEireCompetitions: false })

    expect(await screen.findByText('NAGA Ireland')).toBeInTheDocument()
    expect(
      screen.queryByTestId(BjjEireCompetitionsFeaturedTestIds.FEATURED_SECTION)
    ).not.toBeInTheDocument()
    expect(requested).not.toHaveBeenCalled()
  })

  // Spec edge case: one feature failing must not hide the other.
  it('given the BJJ Éire competitions request fails, when a visitor opens Competitions, then the listing shows and the featured section is left out with no error', async () => {
    seedBjjEireCompetitionsError()
    seedCompetitions([createCompetition({ name: 'NAGA Ireland' })])
    renderCompetitionsPage(ON)

    expect(await screen.findByText('NAGA Ireland')).toBeInTheDocument()
    expect(
      screen.queryByTestId(BjjEireCompetitionsFeaturedTestIds.FEATURED_SECTION)
    ).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /retry/i })).toHaveLength(0)
  })

  it('given the BJJ Éire competitions request is still loading, when the listing has loaded, then the listing shows without the featured section', async () => {
    seedBjjEireCompetitionsPending()
    seedCompetitions([createCompetition({ name: 'NAGA Ireland' })])
    renderCompetitionsPage(ON)

    expect(await screen.findByText('NAGA Ireland')).toBeInTheDocument()
    expect(
      screen.queryByTestId(BjjEireCompetitionsFeaturedTestIds.FEATURED_SECTION)
    ).not.toBeInTheDocument()
  })

  // #3008
  it('given the featured section is shown, when the visitor searches for something that matches nothing in the listing, then the listing shows its empty state and the featured cards stay', async () => {
    seedBjjEireCompetitions(upcoming())
    seedCompetitions([createCompetition({ name: 'NAGA Ireland' })])
    const { user } = renderCompetitionsPage(ON)

    await findFeatured()
    await screen.findByText('NAGA Ireland')
    await user.type(screen.getByRole('searchbox'), 'Spring Open')

    // A search is debounced and loads its own page of 100, so allow for both on a busy run.
    const SEARCH_SETTLES = { timeout: 5000 }
    await waitFor(
      () => expect(screen.queryByText('NAGA Ireland')).not.toBeInTheDocument(),
      SEARCH_SETTLES
    )
    // Asserted inside waitFor: the listing re-renders when the search's page
    // arrives, so a node found a moment earlier can already be replaced.
    await waitFor(() => {
      expect(
        screen.getByText(uiContent.competitions.search.noResultsTitle)
      ).toBeInTheDocument()
      expect(
        within(
          screen.getByTestId(
            BjjEireCompetitionsFeaturedTestIds.FEATURED_SECTION
          )
        ).getAllByTestId(BjjEireCompetitionsFeaturedTestIds.FEATURED_CARD)
      ).toHaveLength(2)
    }, SEARCH_SETTLES)
  })

  // #3008: the featured request carries none of the listing's paging.
  it('given the featured section is shown, then it was fetched as one page of up to 100 regardless of the listing page', async () => {
    const featuredRequests: URLSearchParams[] = []
    seedBjjEireCompetitions(upcoming())
    // Registered last so it sees the request first, then falls through to the seed.
    server.use(
      http.get(BJJEIRE_COMPETITIONS_API, ({ request }) => {
        featuredRequests.push(new URL(request.url).searchParams)
      })
    )
    seedCompetitions([createCompetition({ name: 'NAGA Ireland' })])
    renderWithProviders(<CompetitionsPage />, {
      initialRoutes: [`${paths.competitions.path}?page=2`],
      featureFlags: { Competitions: true, ...ON },
    })

    await findFeatured()
    expect(featuredRequests).toHaveLength(1)
    expect(featuredRequests[0].get('page')).toBe('1')
    expect(featuredRequests[0].get('pageSize')).toBe('100')
  })

  // #3009
  it('given a featured card, when the visitor opens it, then they reach /competitions/{slug}', async () => {
    seedBjjEireCompetitions(upcoming())
    seedCompetitions([])
    const { user } = renderWithProviders(
      <Routes>
        <Route path={paths.competitions.path} element={<CompetitionsPage />} />
        <Route
          path={paths.bjjEireCompetition.path}
          element={<p>competition page reached</p>}
        />
      </Routes>,
      {
        initialRoutes: [paths.competitions.path],
        featureFlags: { Competitions: true, ...ON },
      }
    )

    const section = await findFeatured()
    await user.click(
      within(section).getAllByTestId(BjjEireCompetitionCardTestIds.LINK)[0]
    )

    expect(
      await screen.findByText('competition page reached')
    ).toBeInTheDocument()
  })
})
