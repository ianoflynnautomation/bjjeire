import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import GymsPage from '../GymsPage'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'
import type { HateoasPagination } from '@/types/common'

vi.mock('@/hooks/usePaginatedQuery')
vi.mock('@/utils/scrollUtils', () => ({
  useScrollToTop: vi.fn(() => vi.fn()),
}))
vi.mock('@/features/gyms/components/gym-page-header', () => ({
  GymsPageHeader: vi.fn(({ countyName, totalGyms }) => (
    <div data-testid="mock-header">
      <span data-testid="mock-header-county">{countyName}</span>
      <span data-testid="mock-header-total">{totalGyms}</span>
    </div>
  )),
}))
vi.mock('@/components/ui/filters/select-filter', () => ({
  default: vi.fn(({ value, onChange, disabled, label }) => (
    <select
      data-testid="mock-county-filter"
      aria-label={label || 'County Filter'}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="all">All</option>
      <option value="dublin">Dublin</option>
    </select>
  )),
}))
vi.mock('@/components/ui/state/content-renderer-state', () => ({
  ContentRenderer: vi.fn(
    ({ isLoading, fetchError, data, renderDataComponent }) => {
      if (isLoading) {return <div data-testid="mock-content-loading" />}
      if (fetchError) {return <div data-testid="mock-content-error" />}
      if (data && data.length > 0) {return renderDataComponent(data)}
      return <div data-testid="mock-content-empty" />
    }
  ),
}))
vi.mock('@/features/gyms/components/gym-list', () => ({
  GymsList: vi.fn(({ gyms }) => (
    <div data-testid="mock-gym-list">{gyms.length} items</div>
  )),
}))
vi.mock('@/components/ui/grid/pagination', () => ({
  default: vi.fn(({ onPageChange }) => (
    <button data-testid="mock-pagination" onClick={() => onPageChange(null, 2)}>
      Next
    </button>
  )),
}))

describe('GymsPage Component', () => {
  const mockedUsePaginatedQuery = vi.mocked(usePaginatedQuery)

  const mockUsePaginatedQueryResult = {
    data: [],
    pagination: null,
    isLoading: false,
    isFetching: false,
    error: null,
    params: { county: 'all', page: 1, pageSize: 12 },
    currentPage: 1,
    handlePageChange: vi.fn(),
    updateFilters: vi.fn(),
    refetch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUsePaginatedQuery.mockReturnValue(
      mockUsePaginatedQueryResult as never
    )
  })

  describe('When in loading state', () => {
    it('should render the loading state via ContentRenderer', () => {
      mockedUsePaginatedQuery.mockReturnValue({
        ...mockUsePaginatedQueryResult,
        isLoading: true,
      } as never)
      render(<GymsPage />)

      expect(screen.getByTestId('mock-content-loading')).toBeInTheDocument()
    })
  })

  describe('When data is successfully loaded', () => {
    it('should pass correct props to header, list, and pagination', () => {
      const mockPagination: HateoasPagination = {
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
        pageSize: 12,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPageUrl: null,
        previousPageUrl: null,
      }
      const mockGyms = [MOCK_GYM_FULL, MOCK_GYM_MINIMAL]
      mockedUsePaginatedQuery.mockReturnValue({
        ...mockUsePaginatedQueryResult,
        data: mockGyms,
        pagination: mockPagination,
      } as never)
      render(<GymsPage />)

      expect(screen.getByTestId('mock-header-county')).toHaveTextContent('All Counties')
      expect(screen.getByTestId('mock-header-total')).toHaveTextContent(
        mockPagination.totalItems.toString()
      )
      expect(screen.getByTestId('mock-gym-list')).toHaveTextContent(
        `${mockGyms.length} items`
      )
    })
  })

  describe('When an error occurs', () => {
    it('should render the error state via ContentRenderer', () => {
      mockedUsePaginatedQuery.mockReturnValue({
        ...mockUsePaginatedQueryResult,
        error: new Error('Network Error'),
      } as never)

      render(<GymsPage />)

      expect(screen.getByTestId('mock-content-error')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call updateFilters when the county filter is changed', async () => {
      const user = userEvent.setup()
      render(<GymsPage />)
      const countyFilter = screen.getByRole('combobox', { name: /select county/i })

      await user.selectOptions(countyFilter, 'dublin')

      expect(mockUsePaginatedQueryResult.updateFilters).toHaveBeenCalledWith({
        county: 'dublin',
      })
    })

    it('should call handlePageChange when pagination is used', async () => {
      const user = userEvent.setup()
      mockedUsePaginatedQuery.mockReturnValue({
        ...mockUsePaginatedQueryResult,
        data: [MOCK_GYM_FULL],
        pagination: {
          totalPages: 2,
          totalItems: 15,
          currentPage: 1,
          pageSize: 12,
          hasNextPage: true,
          hasPreviousPage: false,
          nextPageUrl: null,
          previousPageUrl: null,
        },
      } as never)
      render(<GymsPage />)
      const pagination = screen.getByRole('button', { name: /next/i })

      await user.click(pagination)

      expect(mockUsePaginatedQueryResult.handlePageChange).toHaveBeenCalledWith(
        null,
        2
      )
    })
  })
})
