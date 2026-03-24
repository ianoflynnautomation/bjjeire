import { screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosRequestConfig } from 'axios'
import GymsPage from '../GymsPage'
import { api } from '@/lib/api-client'
import type { GymDto } from '@/types/gyms'
import type { PaginatedResponse } from '@/types/common'
import { renderWithProviders } from '@/testing/render-utils'
import {
  createGym,
  createPaginatedGyms,
  resetGymIdCounter,
} from '@/testing/factories/gym.factory'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn() },
}))

describe('GymsPage Integration (API + Query + UI)', () => {
  const mockedApiGet = vi.mocked(api.get)

  beforeEach(() => {
    mockedApiGet.mockReset()
    resetGymIdCounter()
  })

  it('shows loading state while data is being fetched', () => {
    mockedApiGet.mockImplementation(() => new Promise(() => {}))
    renderWithProviders(<GymsPage />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error state and retry button when the API fails', async () => {
    mockedApiGet.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<GymsPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows empty state when no gyms are returned', async () => {
    mockedApiGet.mockResolvedValue(createPaginatedGyms([], 1, 0))
    renderWithProviders(<GymsPage />)

    expect(await screen.findByText('No Gyms Found')).toBeInTheDocument()
  })

  it('renders gym cards when data loads successfully', async () => {
    const dublinGym = createGym({
      name: 'Elite Fighters Academy',
      county: 'Dublin',
    })
    const corkGym = createGym({ name: 'Community BJJ Club', county: 'Cork' })
    mockedApiGet.mockResolvedValue(
      createPaginatedGyms([dublinGym, corkGym], 1, 1)
    )

    renderWithProviders(<GymsPage />)

    expect(
      await screen.findByText('Elite Fighters Academy')
    ).toBeInTheDocument()
    expect(screen.getByText('Community BJJ Club')).toBeInTheDocument()
  })

  it('has no accessibility violations on the happy-path render', async () => {
    const gym = createGym({ name: 'Accessible BJJ Gym', county: 'Dublin' })
    mockedApiGet.mockResolvedValue(createPaginatedGyms([gym], 1, 1))

    const { container } = renderWithProviders(<GymsPage />)
    await screen.findByText('Accessible BJJ Gym')

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('fetches gyms and updates results when county filter changes', async () => {
    const dublinGym = createGym({
      name: 'Elite Fighters Academy',
      county: 'Dublin',
    })
    const corkGym = createGym({ name: 'Community BJJ Club', county: 'Cork' })

    mockedApiGet.mockImplementation(
      (
        _url: string,
        config?: AxiosRequestConfig
      ): Promise<PaginatedResponse<GymDto>> => {
        const params = config?.params as Record<string, unknown> | undefined
        const county = params?.county
        const page = Number(params?.page ?? 1)
        if (county === 'Dublin') {
          return Promise.resolve(createPaginatedGyms([dublinGym], page, 1))
        }
        return Promise.resolve(
          createPaginatedGyms([dublinGym, corkGym], page, 1)
        )
      }
    )

    const { user } = renderWithProviders(<GymsPage />)

    expect(
      await screen.findByText('Elite Fighters Academy')
    ).toBeInTheDocument()
    expect(screen.getByText('Community BJJ Club')).toBeInTheDocument()
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

    expect(
      await screen.findByRole('heading', { name: /bjj gyms in dublin/i })
    ).toBeInTheDocument()
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
    const gymPage1 = createGym({ name: 'Elite Fighters Academy' })
    const gymPage2 = createGym({ name: 'Community BJJ Club' })

    mockedApiGet.mockImplementation(
      (
        _url: string,
        config?: AxiosRequestConfig
      ): Promise<PaginatedResponse<GymDto>> => {
        const params = config?.params as Record<string, unknown> | undefined
        const page = Number(params?.page ?? 1)
        if (page === 2) {
          return Promise.resolve(createPaginatedGyms([gymPage2], 2, 2))
        }
        return Promise.resolve(createPaginatedGyms([gymPage1], 1, 2))
      }
    )

    const { user } = renderWithProviders(<GymsPage />)

    expect(
      await screen.findByText('Elite Fighters Academy')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /next page/i })
    ).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(await screen.findByText('Community BJJ Club')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenLastCalledWith(
        'api/gym',
        expect.objectContaining({
          params: expect.objectContaining({ page: 2, pageSize: 20 }),
        })
      )
    })
  })
})
