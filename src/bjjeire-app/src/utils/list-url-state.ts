import { County } from '@/constants/counties'

export const LIST_PAGE_PARAM = 'page'

/** How one list filter is stored in the URL, so filtered views survive reloads and can be shared. */
export interface ListUrlFilter<TParams> {
  key: keyof TParams & string
  read: (values: string[]) => TParams[keyof TParams & string]
  write: (value: TParams[keyof TParams & string]) => string[]
}

export function readUrlPage(searchParams: URLSearchParams): number {
  const raw = searchParams.get(LIST_PAGE_PARAM) ?? ''
  return /^[1-9]\d*$/.test(raw) ? Number(raw) : 1
}

export function withUrlPage(
  searchParams: URLSearchParams,
  page: number
): URLSearchParams {
  const next = new URLSearchParams(searchParams)
  if (page > 1) {
    next.set(LIST_PAGE_PARAM, String(page))
  } else {
    next.delete(LIST_PAGE_PARAM)
  }
  return next
}

export function readUrlFilters<TParams>(
  searchParams: URLSearchParams,
  urlFilters: readonly ListUrlFilter<TParams>[]
): Partial<TParams> {
  const values: Partial<TParams> = {}
  for (const { key, read } of urlFilters) {
    values[key] = read(searchParams.getAll(key))
  }
  return values
}

/** Applies filter changes to the URL. The result set changes, so paging restarts. */
export function withUrlFilters<TParams>(
  searchParams: URLSearchParams,
  filters: Partial<TParams>,
  urlFilters: readonly ListUrlFilter<TParams>[]
): URLSearchParams {
  const next = withUrlPage(searchParams, 1)
  for (const { key, write } of urlFilters) {
    if (key in filters) {
      next.delete(key)
      for (const value of write(
        filters[key] as TParams[keyof TParams & string]
      )) {
        next.append(key, value)
      }
    }
  }
  return next
}

const ALL_COUNTIES = 'all'
const KNOWN_COUNTIES = new Set<string>(Object.values(County))

export function countyUrlFilter<TParams>(): ListUrlFilter<TParams> {
  return {
    key: 'county' as keyof TParams & string,
    read: ([county]) =>
      (county && KNOWN_COUNTIES.has(county)
        ? county
        : ALL_COUNTIES) as TParams[keyof TParams & string],
    write: value =>
      typeof value === 'string' && value !== ALL_COUNTIES ? [value] : [],
  }
}
