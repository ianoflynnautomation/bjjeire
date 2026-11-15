import type { JSX } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { CompetitorProfileTestIds } from '@/constants/competitorDataTestIds'
import { getOwnHistory } from '../api/competitor-api'
import { OWN_HISTORY_KEY } from '../api/query-keys'

const { history } = uiContent.competitor

/** The competitor's medal totals and the tournaments they entered (#5039). */
export const MedalHistory = function MedalHistory(): JSX.Element {
  const query = useQuery({ queryKey: OWN_HISTORY_KEY, queryFn: getOwnHistory })
  const totals = [
    {
      label: history.gold,
      value: query.data?.gold,
      id: CompetitorProfileTestIds.HISTORY_GOLD,
    },
    {
      label: history.silver,
      value: query.data?.silver,
      id: CompetitorProfileTestIds.HISTORY_SILVER,
    },
    {
      label: history.bronze,
      value: query.data?.bronze,
      id: CompetitorProfileTestIds.HISTORY_BRONZE,
    },
  ]
  const tournaments = query.data?.tournaments ?? []

  return (
    <section
      aria-labelledby="competitor-history-heading"
      className="space-y-4"
      data-testid={CompetitorProfileTestIds.HISTORY}
    >
      <h2 id="competitor-history-heading" className="text-lg font-bold text-fg">
        {history.heading}
      </h2>
      {query.isError && (
        <p role="alert" className="text-sm text-fg-subtle">
          {history.loadFailed}
        </p>
      )}
      {query.isSuccess && (
        <>
          <dl className="grid grid-cols-3 gap-3">
            {totals.map(total => (
              <div
                key={total.label}
                className="rounded-lg bg-surface-solid p-3 text-center shadow-card ring-1 ring-hairline"
              >
                <dt className="text-sm text-fg-subtle">{total.label}</dt>
                <dd
                  className="text-2xl font-bold text-fg"
                  data-testid={total.id}
                >
                  {total.value}
                </dd>
              </div>
            ))}
          </dl>
          {tournaments.length === 0 ? (
            <p
              className="text-sm text-fg-subtle"
              data-testid={CompetitorProfileTestIds.HISTORY_EMPTY}
            >
              {history.empty}
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                {history.tournamentsHeading}
              </caption>
              <thead className="text-fg-subtle">
                <tr>
                  <th scope="col" className="py-2">
                    {history.tournamentsHeading}
                  </th>
                  <th scope="col" className="py-2 text-right">
                    {history.gold}
                  </th>
                  <th scope="col" className="py-2 text-right">
                    {history.silver}
                  </th>
                  <th scope="col" className="py-2 text-right">
                    {history.bronze}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-fg">
                {tournaments.map(entry => (
                  <tr
                    key={entry.tournamentId}
                    data-testid={CompetitorProfileTestIds.HISTORY_ROW}
                  >
                    <td className="py-2">
                      <Link
                        to={paths.tournament.getHref(entry.slug)}
                        className="font-semibold text-primary-700 hover:underline dark:text-primary-300"
                      >
                        {entry.name}
                      </Link>
                    </td>
                    <td className="py-2 text-right">{entry.gold}</td>
                    <td className="py-2 text-right">{entry.silver}</td>
                    <td className="py-2 text-right">{entry.bronze}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  )
}
