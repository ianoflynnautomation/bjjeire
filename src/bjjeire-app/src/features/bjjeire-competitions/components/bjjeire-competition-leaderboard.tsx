import type { JSX } from 'react'
import { Badge } from '@/components/ui/badge/badge'
import { uiContent } from '@/config/ui-content'
import { BjjEireCompetitionLeaderboardTestIds as TestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import { divisionLabel } from '@/features/registrations/utils/registration-format'
import type {
  BjjEireCompetitionDto,
  MedallistDto,
  PodiumDto,
  TeamStandingDto,
  WinnersDto,
} from '@/types/bjjeire-competitions'
import { useBjjEireCompetitionLeaderboard } from '../hooks/useBjjEireCompetitionLeaderboard'

const copy = uiContent.bjjEireCompetitions.leaderboard

type MedalKind = keyof typeof copy.medals

const MEDAL_TEST_IDS: Record<MedalKind, string> = {
  GOLD: TestIds.GOLD,
  SILVER: TestIds.SILVER,
  BRONZE: TestIds.BRONZE,
}

const MEDAL_BADGE = {
  GOLD: 'amber',
  SILVER: 'slate',
  BRONZE: 'beltBrown',
} as const satisfies Record<MedalKind, string>

const MedallistRow = function MedallistRow({
  kind,
  medallist,
}: {
  kind: MedalKind
  medallist: MedallistDto
}): JSX.Element {
  return (
    <li
      className="flex flex-wrap items-center gap-2 py-1.5 text-sm"
      data-testid={MEDAL_TEST_IDS[kind]}
    >
      <Badge text={copy.medals[kind]} colorScheme={MEDAL_BADGE[kind]} />
      <span className="font-semibold text-fg">{medallist.displayName}</span>
      <span className="text-fg-muted">
        {[medallist.academy ?? copy.noAcademy, medallist.affiliation]
          .filter(Boolean)
          .join(' · ')}
      </span>
    </li>
  )
}

const Podium = function Podium({
  podium,
  label,
}: {
  podium: PodiumDto
  label: string
}): JSX.Element {
  return (
    <div
      className="rounded-xl bg-surface-solid p-4 ring-1 ring-hairline"
      data-testid={TestIds.PODIUM}
    >
      <h4 className="text-sm font-semibold text-fg">{label}</h4>
      <ol className="mt-2">
        <MedallistRow kind="GOLD" medallist={podium.gold} />
        {podium.silver && (
          <MedallistRow kind="SILVER" medallist={podium.silver} />
        )}
        {podium.bronzes.map((bronze, index) => (
          // A podium has at most two bronzes, in the order they were recorded.
          <MedallistRow
            key={`${bronze.displayName}-${index}`}
            kind="BRONZE"
            medallist={bronze}
          />
        ))}
      </ol>
      {!podium.pointsAwarded && (
        <p
          className="mt-2 text-xs text-fg-subtle"
          data-testid={TestIds.NO_POINTS}
        >
          {copy.noPoints}
        </p>
      )}
    </div>
  )
}

const Ranking = function Ranking({
  heading,
  headingId,
  rows,
  testId,
}: {
  heading: string
  headingId: string
  rows: TeamStandingDto[]
  testId: string
}): JSX.Element {
  return (
    <div data-testid={testId}>
      <h3 id={headingId} className="mb-2 text-base font-semibold text-fg">
        {heading}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-fg-subtle">{copy.noRanking}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-hairline">
          <table
            aria-labelledby={headingId}
            className="w-full text-left text-sm"
          >
            <thead className="bg-surface-solid text-fg-muted">
              <tr>
                <th scope="col" className="px-3 py-2">
                  {copy.columns.rank}
                </th>
                <th scope="col" className="px-3 py-2">
                  {copy.columns.name}
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  {copy.columns.points}
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  {copy.columns.gold}
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  {copy.columns.silver}
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  {copy.columns.bronze}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map(row => (
                <tr
                  key={`${row.rank}-${row.name}`}
                  data-testid={TestIds.RANKING_ROW}
                >
                  <td className="px-3 py-2 text-fg-muted">{row.rank}</td>
                  <th scope="row" className="px-3 py-2 font-semibold text-fg">
                    {row.name}
                  </th>
                  <td className="px-3 py-2 text-right font-semibold text-fg">
                    {row.points}
                  </td>
                  <td className="px-3 py-2 text-right text-fg-muted">
                    {row.gold}
                  </td>
                  <td className="px-3 py-2 text-right text-fg-muted">
                    {row.silver}
                  </td>
                  <td className="px-3 py-2 text-right text-fg-muted">
                    {row.bronze}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function winnerText(names: string[]): string {
  if (names.length === 0) {
    return copy.winners.none
  }
  return names.length > 1
    ? `${names.join(', ')} (${copy.winners.joint})`
    : names[0]
}

const Winners = function Winners({
  winners,
}: {
  winners: WinnersDto
}): JSX.Element {
  return (
    <div
      className="rounded-xl bg-surface-solid p-4 ring-2 ring-warning-500"
      data-testid={TestIds.WINNERS}
    >
      <h3 className="text-base font-bold text-fg">{copy.winners.heading}</h3>
      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-fg-muted">{copy.winners.academy}</dt>
          <dd className="font-semibold text-fg">
            {winnerText(winners.academies)}
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">{copy.winners.affiliation}</dt>
          <dd className="font-semibold text-fg">
            {winnerText(winners.affiliations)}
          </dd>
        </div>
      </dl>
    </div>
  )
}

interface BjjEireCompetitionLeaderboardProps {
  bjjEireCompetition: BjjEireCompetitionDto
}

/**
 * The public results: each division's podium, the academy and affiliation
 * rankings, and the winners once the competition is finished (US5).
 */
export const BjjEireCompetitionLeaderboard =
  function BjjEireCompetitionLeaderboard({
    bjjEireCompetition,
  }: BjjEireCompetitionLeaderboardProps): JSX.Element {
    const query = useBjjEireCompetitionLeaderboard(bjjEireCompetition.id)
    const leaderboard = query.data

    return (
      <section
        aria-labelledby="bjjeire-competition-leaderboard-heading"
        className="mt-8 space-y-6"
        data-testid={TestIds.ROOT}
      >
        <div>
          <h2
            id="bjjeire-competition-leaderboard-heading"
            className="mb-1 text-lg font-bold text-fg"
          >
            {copy.heading}
          </h2>
          <p className="text-sm text-fg-subtle">{copy.intro}</p>
        </div>
        {query.isError && (
          <p
            role="alert"
            className="text-sm text-fg-subtle"
            data-testid={TestIds.ERROR}
          >
            {copy.loadFailed}
          </p>
        )}
        {leaderboard?.podiums.length === 0 && (
          <p className="text-sm text-fg-subtle" data-testid={TestIds.EMPTY}>
            {copy.empty}
          </p>
        )}
        {leaderboard && leaderboard.podiums.length > 0 && (
          <>
            {leaderboard.winners && <Winners winners={leaderboard.winners} />}
            <div className="grid gap-6 lg:grid-cols-2">
              <Ranking
                heading={copy.academyRankingHeading}
                headingId="bjjeire-competition-academy-ranking"
                rows={leaderboard.academyRanking}
                testId={TestIds.ACADEMY_RANKING}
              />
              <Ranking
                heading={copy.affiliationRankingHeading}
                headingId="bjjeire-competition-affiliation-ranking"
                rows={leaderboard.affiliationRanking}
                testId={TestIds.AFFILIATION_RANKING}
              />
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold text-fg">
                {copy.podiumsHeading}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {leaderboard.podiums.map(podium => {
                  const division = bjjEireCompetition.divisions.find(
                    item => item.id === podium.divisionId
                  )
                  return (
                    <Podium
                      key={podium.divisionId}
                      podium={podium}
                      label={
                        division ? divisionLabel(division) : podium.divisionId
                      }
                    />
                  )
                })}
              </div>
            </div>
          </>
        )}
      </section>
    )
  }
