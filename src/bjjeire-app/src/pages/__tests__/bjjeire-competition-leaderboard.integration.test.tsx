import { screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BjjEireCompetitionLeaderboardTestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import { uiContent } from '@/config/ui-content'
import {
  createBjjEireCompetition,
  createDivision,
} from '@/testing/factories/bjjeire-competition.factory'
import {
  createEmptyLeaderboard,
  createMedallist,
  createPodium,
  createStanding,
} from '@/testing/factories/result.factory'
import {
  renderBjjEireCompetitionPage,
  seedBjjEireCompetition,
  seedBjjEireCompetitionLeaderboard,
} from '@/features/bjjeire-competitions/testing/bjjeire-competitions-test-helpers'
import type { BjjEireCompetitionDto } from '@/types/bjjeire-competitions'

const copy = uiContent.bjjEireCompetitions.leaderboard

function competition(
  overrides: Partial<BjjEireCompetitionDto> = {}
): BjjEireCompetitionDto {
  return createBjjEireCompetition({
    slug: 'bjjeire',
    name: 'BjjEire',
    divisions: [
      createDivision({
        id: 'division-a',
        belt: 'WHITE',
        weightClass: '-76 kg',
      }),
      createDivision({ id: 'division-b', belt: 'BLUE', weightClass: '-82 kg' }),
    ],
    ...overrides,
  })
}

describe('Competition leaderboard (API + Query + UI)', () => {
  // #5034
  it('given no results yet, when a visitor opens the competition, then they are told results will appear as divisions finish', async () => {
    const bjjeire = competition()
    seedBjjEireCompetition(bjjeire)
    seedBjjEireCompetitionLeaderboard(bjjeire.id, createEmptyLeaderboard())

    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByTestId(BjjEireCompetitionLeaderboardTestIds.EMPTY)
    ).toHaveTextContent(copy.empty)
    expect(
      screen.queryByTestId(BjjEireCompetitionLeaderboardTestIds.PODIUM)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId(BjjEireCompetitionLeaderboardTestIds.WINNERS)
    ).not.toBeInTheDocument()
  })

  // #5028
  it('given a recorded podium, when a visitor opens the competition, then they see gold, silver and bronze for that division', async () => {
    const bjjeire = competition()
    seedBjjEireCompetition(bjjeire)
    seedBjjEireCompetitionLeaderboard(
      bjjeire.id,
      createEmptyLeaderboard({
        podiums: [
          createPodium({
            divisionId: 'division-b',
            gold: createMedallist({ displayName: 'Aoife Byrne' }),
            silver: createMedallist({ displayName: 'Ciaran Byrne' }),
            bronzes: [
              createMedallist({ displayName: 'Niamh Byrne' }),
              createMedallist({ displayName: 'Sean Byrne', academy: null }),
            ],
          }),
        ],
      })
    )

    renderBjjEireCompetitionPage('bjjeire')

    const podium = await screen.findByTestId(
      BjjEireCompetitionLeaderboardTestIds.PODIUM
    )
    expect(podium).toHaveTextContent('Blue')
    expect(podium).toHaveTextContent('-82 kg')
    const gold = within(podium).getByTestId(
      BjjEireCompetitionLeaderboardTestIds.GOLD
    )
    expect(gold).toHaveTextContent('Aoife Byrne')
    expect(gold).toHaveTextContent(copy.medals.GOLD)
    expect(
      within(podium).getByTestId(BjjEireCompetitionLeaderboardTestIds.SILVER)
    ).toHaveTextContent('Ciaran Byrne')
    const bronzes = within(podium).getAllByTestId(
      BjjEireCompetitionLeaderboardTestIds.BRONZE
    )
    expect(bronzes).toHaveLength(2)
    expect(bronzes[1]).toHaveTextContent('Sean Byrne')
    expect(bronzes[1]).toHaveTextContent(copy.noAcademy)
    expect(
      screen.queryByTestId(BjjEireCompetitionLeaderboardTestIds.EMPTY)
    ).not.toBeInTheDocument()
  })

  // #5032
  it('given a division with one confirmed competitor, when its podium is shown, then it says no team points were awarded', async () => {
    const bjjeire = competition()
    seedBjjEireCompetition(bjjeire)
    seedBjjEireCompetitionLeaderboard(
      bjjeire.id,
      createEmptyLeaderboard({
        podiums: [
          createPodium({
            divisionId: 'division-a',
            silver: null,
            bronzes: [],
            pointsAwarded: false,
          }),
        ],
      })
    )

    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByTestId(BjjEireCompetitionLeaderboardTestIds.NO_POINTS)
    ).toHaveTextContent(copy.noPoints)
  })

  // #5029, #5030, #5040
  it('given recorded podiums, when a visitor opens the competition, then they see an academy ranking and an affiliation ranking with points and medals', async () => {
    const bjjeire = competition()
    seedBjjEireCompetition(bjjeire)
    seedBjjEireCompetitionLeaderboard(
      bjjeire.id,
      createEmptyLeaderboard({
        podiums: [createPodium({ divisionId: 'division-a' })],
        academyRanking: [
          createStanding({ rank: 1, name: 'Team X', points: 9, gold: 1 }),
          createStanding({
            rank: 2,
            name: 'Team Y',
            points: 9,
            gold: 0,
            silver: 3,
          }),
        ],
        affiliationRanking: [
          createStanding({
            rank: 1,
            name: 'Alliance',
            points: 18,
            gold: 1,
            silver: 3,
          }),
        ],
      })
    )

    renderBjjEireCompetitionPage('bjjeire')

    const academies = await screen.findByTestId(
      BjjEireCompetitionLeaderboardTestIds.ACADEMY_RANKING
    )
    const academyRows = within(academies).getAllByTestId(
      BjjEireCompetitionLeaderboardTestIds.RANKING_ROW
    )
    expect(academyRows).toHaveLength(2)
    expect(academyRows[0]).toHaveTextContent('Team X')
    expect(academyRows[0]).toHaveTextContent('9')
    expect(academyRows[1]).toHaveTextContent('Team Y')
    expect(
      within(academies).getByRole('columnheader', { name: copy.columns.points })
    ).toBeInTheDocument()
    const affiliations = screen.getByTestId(
      BjjEireCompetitionLeaderboardTestIds.AFFILIATION_RANKING
    )
    expect(
      within(affiliations).getByTestId(
        BjjEireCompetitionLeaderboardTestIds.RANKING_ROW
      )
    ).toHaveTextContent('Alliance')
    expect(
      within(affiliations).getByTestId(
        BjjEireCompetitionLeaderboardTestIds.RANKING_ROW
      )
    ).toHaveTextContent('18')
  })

  // #5041
  it('given a finished competition, when a visitor opens it, then the winning academy and affiliation are shown', async () => {
    const bjjeire = competition({
      status: 'FINISHED',
      registrationState: 'CLOSED',
    })
    seedBjjEireCompetition(bjjeire)
    seedBjjEireCompetitionLeaderboard(
      bjjeire.id,
      createEmptyLeaderboard({
        podiums: [createPodium({ divisionId: 'division-a' })],
        academyRanking: [createStanding({ name: 'Team X' })],
        affiliationRanking: [createStanding({ name: 'Alliance' })],
        winners: { academies: ['Team X'], affiliations: ['Alliance'] },
      })
    )

    renderBjjEireCompetitionPage('bjjeire')

    const winners = await screen.findByTestId(
      BjjEireCompetitionLeaderboardTestIds.WINNERS
    )
    expect(winners).toHaveTextContent(copy.winners.academy)
    expect(winners).toHaveTextContent('Team X')
    expect(winners).toHaveTextContent(copy.winners.affiliation)
    expect(winners).toHaveTextContent('Alliance')
  })

  // #5041
  it('given joint winners, when a visitor opens the finished competition, then every joint winner is named', async () => {
    const bjjeire = competition({
      status: 'FINISHED',
      registrationState: 'CLOSED',
    })
    seedBjjEireCompetition(bjjeire)
    seedBjjEireCompetitionLeaderboard(
      bjjeire.id,
      createEmptyLeaderboard({
        podiums: [createPodium({ divisionId: 'division-a' })],
        academyRanking: [
          createStanding({ name: 'Team A' }),
          createStanding({ name: 'Team B' }),
        ],
        winners: { academies: ['Team A', 'Team B'], affiliations: [] },
      })
    )

    renderBjjEireCompetitionPage('bjjeire')

    const winners = await screen.findByTestId(
      BjjEireCompetitionLeaderboardTestIds.WINNERS
    )
    expect(winners).toHaveTextContent('Team A')
    expect(winners).toHaveTextContent('Team B')
    expect(winners).toHaveTextContent(copy.winners.joint)
  })

  // #5041
  it('given a published competition, when a visitor opens it, then no winners are shown yet', async () => {
    const bjjeire = competition()
    seedBjjEireCompetition(bjjeire)
    seedBjjEireCompetitionLeaderboard(
      bjjeire.id,
      createEmptyLeaderboard({
        podiums: [createPodium({ divisionId: 'division-a' })],
        academyRanking: [createStanding()],
      })
    )

    renderBjjEireCompetitionPage('bjjeire')

    expect(
      await screen.findByTestId(BjjEireCompetitionLeaderboardTestIds.PODIUM)
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId(BjjEireCompetitionLeaderboardTestIds.WINNERS)
    ).not.toBeInTheDocument()
  })
})
