import { withUrlPage } from '@/utils/list-url-state'

export type GymView = 'list' | 'map'

const VIEW_PARAM = 'view'
const MAP_VIEW = 'map'

/** No value or an unknown value opens the list, so a bad link never strands a visitor. */
export function readGymView(searchParams: URLSearchParams): GymView {
  return searchParams.get(VIEW_PARAM) === MAP_VIEW ? 'map' : 'list'
}

/** Switching view keeps the search and county. Paging belongs to one list view, so it restarts. */
export function withGymView(
  searchParams: URLSearchParams,
  view: GymView
): URLSearchParams {
  const next = withUrlPage(searchParams, 1)
  if (view === 'map') {
    next.set(VIEW_PARAM, MAP_VIEW)
  } else {
    next.delete(VIEW_PARAM)
  }
  return next
}
