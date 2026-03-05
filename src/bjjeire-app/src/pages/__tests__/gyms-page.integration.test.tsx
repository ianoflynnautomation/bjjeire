import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosRequestConfig } from 'axios'
import GymsPage from '../GymsPage'
import { api } from '@/lib/api-client'
import type { GymDto } from '@/types/gyms'
import type { PaginatedResponse } from '@/types/common'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'

vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
  },
}))

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })

const renderWithQueryClient = (): void => {
  const queryClient = createQueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <GymsPage />
    </QueryClientProvider>
  )
}

const createPaginatedResponse = (
  gyms: GymDto[],
  page: number,
  totalPages: number
): PaginatedResponse<GymDto> => ({
  data: gyms,
  pagination: {
    totalItems: gyms.length,
    currentPage: page,
    pageSize: 20,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPageUrl: page < totalPages ? `/api/gym?page=${page + 1}` : null,
    previousPageUrl: page > 1 ? `/api/gym?page=${page - 1}` : null,
  },
})

describe('GymsPage Integration (API + Query + UI)', () => {
  const mockedApiGet = vi.mocked(api.get)

  beforeEach(() => {
    mockedApiGet.mockReset()
  })

  it('fetches gyms and updates results when county filter changes', async () => {
    mockedApiGet.mockImplementation(
      (
        _url: string,
        config?: AxiosRequestConfig
      ): Promise<PaginatedResponse<GymDto>> => {
        const params = config?.params as Record<string, unknown> | undefined
        const county = params?.county
        const page = Number(params?.page ?? 1)

        if (county === 'Dublin') {
          return Promise.resolve(createPaginatedResponse([MOCK_GYM_FULL], page, 1))
        }

        return Promise.resolve(
          createPaginatedResponse([MOCK_GYM_FULL, MOCK_GYM_MINIMAL], page, 1)
        )
      }
    )

    const user = userEvent.setup()
    renderWithQueryClient()

    expect(await screen.findByText('Elite Fighters Academy')).toBeInTheDocument()
    expect(await screen.findByText('Community BJJ Club')).toBeInTheDocument()
    expect(screen.getByText('Found 2 gyms.')).toBeInTheDocument()
    expect(mockedApiGet).toHaveBeenCalledWith(
      'api/gym',
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, pageSize: 20 }),
      })
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: /select county/i }),
      'Dublin'
    )

    expect(await screen.findByRole('heading', { name: /bjj gyms in dublin/i })).toBeInTheDocument()
    expect(screen.getByText('Found 1 gym.')).toBeInTheDocument()
    expect(screen.getByText('Elite Fighters Academy')).toBeInTheDocument()
    expect(screen.queryByText('Community BJJ Club')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenLastCalledWith(
        'api/gym',
        expect.objectContaining({
          params: expect.objectContaining({
            county: 'Dublin',
            page: 1,
            pageSize: 20,
          }),
        })
      )
    })
  })

  it('fetches next page when user uses pagination controls', async () => {
    mockedApiGet.mockImplementation(
      (
        _url: string,
        config?: AxiosRequestConfig
      ): Promise<PaginatedResponse<GymDto>> => {
        const params = config?.params as Record<string, unknown> | undefined
        const page = Number(params?.page ?? 1)

        if (page === 2) {
          return Promise.resolve(createPaginatedResponse([MOCK_GYM_MINIMAL], 2, 2))
        }

        return Promise.resolve(createPaginatedResponse([MOCK_GYM_FULL], 1, 2))
      }
    )

    const user = userEvent.setup()
    renderWithQueryClient()

    expect(await screen.findByText('Elite Fighters Academy')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(await screen.findByText('Community BJJ Club')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenLastCalledWith(
        'api/gym',
        expect.objectContaining({
          params: expect.objectContaining({
            page: 2,
            pageSize: 20,
          }),
        })
      )
    })
  })
})
