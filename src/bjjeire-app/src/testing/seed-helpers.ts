import { http, HttpResponse } from 'msw'
import { server } from './msw/server'
import type { PaginatedResponse } from '@/types/common'

export const TEST_API_ORIGIN = 'http://localhost'

export function testApiUrl(route: string): string {
  return `${TEST_API_ORIGIN}${route}`
}

export interface ListSeeds<TDto> {
  seed: (items?: TDto[]) => void
  seedPaged: (pages: Record<number, PaginatedResponse<TDto>>) => {
    getLastUrl: () => URL | null
  }
  seedByParam: (
    paramName: string,
    byValue: Record<string, TDto[]>,
    fallback?: TDto[]
  ) => { getLastUrl: () => URL | null }
  seedError: (status?: number) => void
  seedPending: () => void
}

export function createListSeeds<TDto>(
  url: string,
  paginate: (
    items: TDto[],
    page: number,
    totalPages: number
  ) => PaginatedResponse<TDto>,
  defaultItems: () => TDto[]
): ListSeeds<TDto> {
  return {
    seed(items = defaultItems()): void {
      server.use(http.get(url, () => HttpResponse.json(paginate(items, 1, 1))))
    },

    seedPaged(pages): { getLastUrl: () => URL | null } {
      let lastUrl: URL | null = null
      server.use(
        http.get(url, ({ request }) => {
          lastUrl = new URL(request.url)
          const page = Number(lastUrl.searchParams.get('page') ?? 1)
          return HttpResponse.json(pages[page] ?? pages[1])
        })
      )
      return { getLastUrl: (): URL | null => lastUrl }
    },

    seedByParam(
      paramName,
      byValue,
      fallback = []
    ): { getLastUrl: () => URL | null } {
      let lastUrl: URL | null = null
      server.use(
        http.get(url, ({ request }) => {
          lastUrl = new URL(request.url)
          const value = lastUrl.searchParams.get(paramName)
          const items = value ? (byValue[value] ?? fallback) : fallback
          return HttpResponse.json(paginate(items, 1, 1))
        })
      )
      return { getLastUrl: (): URL | null => lastUrl }
    },

    seedError(status = 500): void {
      server.use(http.get(url, () => HttpResponse.json(null, { status })))
    },

    seedPending(): void {
      server.use(http.get(url, () => new Promise(() => {})))
    },
  }
}
