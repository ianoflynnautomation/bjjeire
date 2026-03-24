import { screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosRequestConfig } from 'axios'
import EventsPage from '../EventsPage'
import { api } from '@/lib/api-client'
import type { BjjEventDto } from '@/types/event'
import { BjjEventType } from '@/types/event'
import type { PaginatedResponse } from '@/types/common'
import { County } from '@/constants/counties'
import { renderWithProviders } from '@/testing/render-utils'
import {
  createEvent,
  createPaginatedEvents,
  resetEventIdCounter,
} from '@/testing/factories/event.factory'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn() },
}))

describe('EventsPage Integration (API + Query + UI)', () => {
  const mockedApiGet = vi.mocked(api.get)

  beforeEach(() => {
    mockedApiGet.mockReset()
    resetEventIdCounter()
  })

  it('shows loading state while data is being fetched', () => {
    mockedApiGet.mockImplementation(() => new Promise(() => {}))
    renderWithProviders(<EventsPage />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error state and retry button when the API fails', async () => {
    mockedApiGet.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<EventsPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows empty state when no events are returned', async () => {
    mockedApiGet.mockResolvedValue(createPaginatedEvents([], 1, 0))
    renderWithProviders(<EventsPage />)

    expect(await screen.findByText('No Events Found')).toBeInTheDocument()
  })

  it('renders event cards when data loads successfully', async () => {
    const dublinEvent = createEvent({
      name: 'Dublin Open Mat 2026',
      county: County.Dublin,
    })
    const corkEvent = createEvent({ name: 'Cork Seminar', county: County.Cork })
    mockedApiGet.mockResolvedValue(
      createPaginatedEvents([dublinEvent, corkEvent], 1, 1)
    )

    renderWithProviders(<EventsPage />)

    expect(await screen.findByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.getByText('Cork Seminar')).toBeInTheDocument()
  })

  it('has no accessibility violations on the happy-path render', async () => {
    const event = createEvent({
      name: 'Accessible BJJ Event',
      county: County.Dublin,
    })
    mockedApiGet.mockResolvedValue(createPaginatedEvents([event], 1, 1))

    const { container } = renderWithProviders(<EventsPage />)
    await screen.findByText('Accessible BJJ Event')

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('fetches events and updates results when county filter changes', async () => {
    const dublinEvent = createEvent({
      name: 'Dublin Open Mat 2026',
      county: County.Dublin,
    })
    const corkEvent = createEvent({ name: 'Cork Seminar', county: County.Cork })

    mockedApiGet.mockImplementation(
      (
        _url: string,
        config?: AxiosRequestConfig
      ): Promise<PaginatedResponse<BjjEventDto>> => {
        const params = config?.params as Record<string, unknown> | undefined
        const county = params?.county
        const page = Number(params?.page ?? 1)
        if (county === 'Dublin') {
          return Promise.resolve(createPaginatedEvents([dublinEvent], page, 1))
        }
        return Promise.resolve(
          createPaginatedEvents([dublinEvent, corkEvent], page, 1)
        )
      }
    )

    const { user } = renderWithProviders(<EventsPage />)

    expect(await screen.findByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.getByText('Cork Seminar')).toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /select county/i }),
      'Dublin'
    )

    expect(await screen.findByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.queryByText('Cork Seminar')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenLastCalledWith(
        'api/bjjevent',
        expect.objectContaining({
          params: expect.objectContaining({ county: 'Dublin', page: 1 }),
        })
      )
    })
  })

  it('filters events by type when event type button is clicked', async () => {
    const openMat = createEvent({
      name: 'Dublin Open Mat',
      type: BjjEventType.OpenMat,
    })
    const tournament = createEvent({
      name: 'Cork Tournament',
      type: BjjEventType.Tournament,
    })

    mockedApiGet.mockImplementation(
      (
        _url: string,
        config?: AxiosRequestConfig
      ): Promise<PaginatedResponse<BjjEventDto>> => {
        const params = config?.params as Record<string, unknown> | undefined
        const type = params?.type
        const page = Number(params?.page ?? 1)
        if (type === BjjEventType.Tournament) {
          return Promise.resolve(createPaginatedEvents([tournament], page, 1))
        }
        return Promise.resolve(
          createPaginatedEvents([openMat, tournament], page, 1)
        )
      }
    )

    const { user } = renderWithProviders(<EventsPage />)

    expect(await screen.findByText('Dublin Open Mat')).toBeInTheDocument()
    expect(screen.getByText('Cork Tournament')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /tournament/i }))

    expect(await screen.findByText('Cork Tournament')).toBeInTheDocument()
    expect(screen.queryByText('Dublin Open Mat')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenLastCalledWith(
        'api/bjjevent',
        expect.objectContaining({
          params: expect.objectContaining({
            type: BjjEventType.Tournament,
            page: 1,
          }),
        })
      )
    })
  })

  it('fetches next page when user uses pagination controls', async () => {
    const eventPage1 = createEvent({ name: 'Dublin Open Mat 2026' })
    const eventPage2 = createEvent({ name: 'Cork Seminar' })

    mockedApiGet.mockImplementation(
      (
        _url: string,
        config?: AxiosRequestConfig
      ): Promise<PaginatedResponse<BjjEventDto>> => {
        const params = config?.params as Record<string, unknown> | undefined
        const page = Number(params?.page ?? 1)
        if (page === 2) {
          return Promise.resolve(createPaginatedEvents([eventPage2], 2, 2))
        }
        return Promise.resolve(createPaginatedEvents([eventPage1], 1, 2))
      }
    )

    const { user } = renderWithProviders(<EventsPage />)

    expect(await screen.findByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /next page/i })
    ).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(await screen.findByText('Cork Seminar')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenLastCalledWith(
        'api/bjjevent',
        expect.objectContaining({
          params: expect.objectContaining({ page: 2 }),
        })
      )
    })
  })
})
