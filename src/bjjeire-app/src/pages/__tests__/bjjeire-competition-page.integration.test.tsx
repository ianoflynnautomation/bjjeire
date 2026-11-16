import { screen, waitFor, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BjjEireCompetitionPageTestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import {
  createDivision,
  createBjjEireCompetition,
} from '@/testing/factories/bjjeire-competition.factory'
import {
  renderBjjEireCompetitionPage,
  seedBjjEireCompetition,
  seedBjjEireCompetitionStatus,
} from '@/features/bjjeire-competitions/testing/bjjeire-competitions-test-helpers'
import type { BjjEireCompetitionDto } from '@/types/bjjeire-competitions'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import {
  BjjEireCompetitionCompetitorsTestIds,
  BjjEireCompetitionSignUpTestIds,
} from '@/constants/registrationDataTestIds'
import {
  createDivisionCompetitors,
  createListedCompetitor,
} from '@/testing/factories/registration.factory'
import { seedBjjEireCompetitionCompetitors } from '@/features/registrations/testing/registration-test-helpers'

function bjjeire(
  overrides: Partial<BjjEireCompetitionDto> = {}
): BjjEireCompetitionDto {
  return createBjjEireCompetition({
    slug: 'bjjeire',
    name: 'BjjEire',
    description: 'The first in-house competition.',
    date: '2026-06-27',
    venue: { venue: 'National Arena', address: '1 Main Street, Dublin' },
    entryFeeCents: 2500,
    registrationOpensAt: '2026-06-01T09:00:00Z',
    registrationClosesAt: '2026-06-20T20:00:00Z',
    ...overrides,
  })
}

function expectNoSignUpControl(): void {
  expect(
    screen.queryByRole('link', { name: /sign up|register|enter/i })
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /sign up|register|enter/i })
  ).not.toBeInTheDocument()
}

describe('CompetitionPage Integration (API + Query + UI)', () => {
  // #5002
  it('given a published competition, when a visitor opens its page, then they see its details, fee, registration window and divisions', async () => {
    seedBjjEireCompetition(
      bjjeire({
        divisions: [
          createDivision({ belt: 'WHITE', weightClass: '-76 kg' }),
          createDivision({ belt: 'BLUE', weightClass: '-82.3 kg' }),
          createDivision({
            discipline: 'NO_GI',
            gender: 'FEMALE',
            ageCategory: 'MASTER_1',
            belt: 'PURPLE',
            weightClass: '-64 kg',
          }),
        ],
      })
    )
    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'BjjEire' })
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(BjjEireCompetitionPageTestIds.DATE)
    ).toHaveTextContent('27 June 2026')
    expect(
      screen.getByTestId(BjjEireCompetitionPageTestIds.VENUE)
    ).toHaveTextContent('National Arena')
    expect(
      screen.getByTestId(BjjEireCompetitionPageTestIds.VENUE)
    ).toHaveTextContent('1 Main Street, Dublin')
    expect(
      screen.getByTestId(BjjEireCompetitionPageTestIds.FEE)
    ).toHaveTextContent('€25.00')
    // Shown as the clock reads in Ireland, whatever the visitor's time zone.
    expect(
      screen.getByTestId(BjjEireCompetitionPageTestIds.WINDOW)
    ).toHaveTextContent('1 June 2026, 10:00 to 20 June 2026, 21:00')
    expect(
      screen.getByTestId(BjjEireCompetitionPageTestIds.WINDOW)
    ).toHaveTextContent('Irish time')
    expect(
      screen.getByText('The first in-house competition.')
    ).toBeInTheDocument()

    const groups = screen.getAllByTestId(
      BjjEireCompetitionPageTestIds.DIVISION_GROUP
    )
    expect(groups).toHaveLength(2)
    const giMale = within(groups[0])
    expect(
      giMale.getByRole('heading', { name: 'Gi · Male' })
    ).toBeInTheDocument()
    const rows = giMale.getAllByTestId(
      BjjEireCompetitionPageTestIds.DIVISION_ROW
    )
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Adult')
    expect(rows[0]).toHaveTextContent('White')
    expect(rows[0]).toHaveTextContent('-76 kg')
    expect(rows[1]).toHaveTextContent('Blue')
    expect(
      within(groups[1]).getByRole('heading', { name: 'No-Gi · Female' })
    ).toBeInTheDocument()
    expect(groups[1]).toHaveTextContent('Master 1')
    await waitFor(() => expect(document.title).toBe('BjjEire | BJJ Éire'))
  })

  // #5003
  it('given registration has not opened, when a visitor opens the page, then it states when registration opens and offers no sign-up', async () => {
    seedBjjEireCompetition(bjjeire({ registrationState: 'NOT_OPEN' }))
    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByTestId(
        BjjEireCompetitionPageTestIds.REGISTRATION_MESSAGE
      )
    ).toHaveTextContent('Registration opens on 1 June 2026, 10:00.')
    expectNoSignUpControl()
  })

  // #5003
  it('given registration has closed, when a visitor opens the page, then it states that registration is closed and offers no sign-up', async () => {
    seedBjjEireCompetition(bjjeire({ registrationState: 'CLOSED' }))
    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByTestId(
        BjjEireCompetitionPageTestIds.REGISTRATION_MESSAGE
      )
    ).toHaveTextContent('Registration is closed.')
    expectNoSignUpControl()
  })

  it('given a competition with a competitor limit, when the page renders, then the places taken are shown', async () => {
    seedBjjEireCompetition(
      bjjeire({
        competitorLimit: 200,
        placesTaken: 200,
        registrationState: 'FULL',
      })
    )
    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByTestId(BjjEireCompetitionPageTestIds.PLACES)
    ).toHaveTextContent('200 of 200 taken')
    expect(
      screen.getByTestId(BjjEireCompetitionPageTestIds.REGISTRATION_MESSAGE)
    ).toHaveTextContent('This competition is full.')
  })

  it('given a competition with no limit, when the page renders, then no places line is shown', async () => {
    seedBjjEireCompetition(bjjeire())
    renderBjjEireCompetitionPage('bjjeire')

    await screen.findByRole('heading', { level: 1, name: 'BjjEire' })
    expect(
      screen.queryByTestId(BjjEireCompetitionPageTestIds.PLACES)
    ).not.toBeInTheDocument()
  })

  it('given a cancelled competition, when the page renders, then it says so', async () => {
    seedBjjEireCompetition(
      bjjeire({ status: 'CANCELLED', registrationState: 'CLOSED' })
    )
    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByTestId(
        BjjEireCompetitionPageTestIds.REGISTRATION_MESSAGE
      )
    ).toHaveTextContent('This competition has been cancelled.')
  })

  // #5001, #3009: a draft answers 404, so a visitor sees the same as for an unknown address.
  it('given no public competition has the slug, when a visitor opens the page, then they are told it was not found and linked back to Competitions', async () => {
    seedBjjEireCompetitionStatus('hidden-draft', 404)
    renderBjjEireCompetitionPage('hidden-draft')

    expect(
      await screen.findByRole('heading', { name: 'Competition not found' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'See all competitions' })
    ).toHaveAttribute('href', paths.competitions.getHref())
  })

  // Spec edge case "Theme" (ADR-0011): the page never changes the visitor's theme.
  it.each(['light', 'dark', 'competition'] as const)(
    'given the %s theme is chosen, when a visitor opens a BJJ Éire competition page, then it renders and the chosen theme is kept',
    async theme => {
      localStorage.setItem('bjjeire-theme', theme)
      const classes = document.documentElement.className
      seedBjjEireCompetition(bjjeire())
      renderBjjEireCompetitionPage('bjjeire')

      expect(
        await screen.findByTestId(BjjEireCompetitionPageTestIds.NAME)
      ).toBeInTheDocument()
      expect(localStorage.getItem('bjjeire-theme')).toBe(theme)
      expect(document.documentElement.className).toBe(classes)
      localStorage.removeItem('bjjeire-theme')
    }
  )

  it('given the API fails, when a visitor opens the page, then a retry is offered', async () => {
    seedBjjEireCompetitionStatus('bjjeire', 500)
    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByRole('button', { name: /retry/i })
    ).toBeInTheDocument()
  })

  it('given a competition with no divisions listed, when the page renders, then it says they are not announced', async () => {
    seedBjjEireCompetition(bjjeire({ divisions: [] }))
    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByText('Divisions have not been announced yet.')
    ).toBeInTheDocument()
  })

  // #5013: the way in to a sign-up while registration is open.
  it('given registration is open, when a visitor opens the page, then it offers a sign-up link to the sign-up page', async () => {
    seedBjjEireCompetition(bjjeire({ registrationState: 'OPEN' }))
    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByTestId(BjjEireCompetitionSignUpTestIds.SIGN_UP_LINK)
    ).toHaveAttribute('href', paths.bjjEireCompetitionSignUp.getHref('bjjeire'))
  })

  it('given the competition is full, when a visitor opens the page, then no sign-up link is offered', async () => {
    seedBjjEireCompetition(bjjeire({ registrationState: 'FULL' }))
    renderBjjEireCompetitionPage('bjjeire')

    await screen.findByTestId(BjjEireCompetitionPageTestIds.ROOT)
    expect(
      screen.queryByTestId(BjjEireCompetitionSignUpTestIds.SIGN_UP_LINK)
    ).not.toBeInTheDocument()
  })

  // #5015, FR-011: confirmed competitors by division, name and academy only.
  it('given confirmed competitors, when a visitor opens the page, then each division lists their name, academy and affiliation', async () => {
    const lightweight = createDivision({ weightClass: '-70 kg' })
    const middleweight = createDivision({ weightClass: '-76 kg' })
    const bjjEireCompetition = bjjeire({
      divisions: [lightweight, middleweight],
    })
    seedBjjEireCompetition(bjjEireCompetition)
    seedBjjEireCompetitionCompetitors(bjjEireCompetition.id, [
      createDivisionCompetitors(lightweight.id ?? '', [
        createListedCompetitor({ displayName: 'Aoife Byrne' }),
        createListedCompetitor({
          displayName: 'Ciaran Byrne',
          academy: null,
          affiliation: null,
        }),
      ]),
      createDivisionCompetitors(middleweight.id ?? '', []),
    ])
    renderBjjEireCompetitionPage('bjjeire')

    const divisions = await screen.findAllByTestId(
      BjjEireCompetitionCompetitorsTestIds.DIVISION
    )
    expect(divisions).toHaveLength(1)
    expect(divisions[0]).toHaveTextContent('-70 kg')
    const rows = within(divisions[0]).getAllByTestId(
      BjjEireCompetitionCompetitorsTestIds.ROW
    )
    expect(rows[0]).toHaveTextContent('Aoife Byrne')
    expect(rows[0]).toHaveTextContent('Team X · Alliance')
    expect(rows[1]).toHaveTextContent('Ciaran Byrne')
    expect(rows[1]).toHaveTextContent(
      uiContent.registrations.competitors.noAcademy
    )
  })

  it('given no confirmed competitors, when a visitor opens the page, then the competitor list says so', async () => {
    seedBjjEireCompetition(bjjeire())
    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByTestId(BjjEireCompetitionCompetitorsTestIds.EMPTY)
    ).toHaveTextContent(uiContent.registrations.competitors.empty)
  })
})
