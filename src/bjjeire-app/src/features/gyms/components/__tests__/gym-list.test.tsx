import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GymsList } from './../gym-list'
import { GymsListTestIds } from '../../../../constants/gymDataTestIds'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'
import { GymDto } from '../../../../types/gyms'
import { GymCard } from '../gym-card/gym-card'

// Mock GymCard to verify props and count
vi.mock('./GymCard', () => ({
  // Adjust path to GymCard
  GymCard: vi.fn(({ gym, 'data-testid': dtId }) => (
    <div data-testid={dtId}>Mocked GymCard for: {gym.name}</div>
  )),
}))

describe('GymsList Component', () => {
  const defaultProps = {
    testIdInstanceSuffix: 'test-list-suffix',
  }

  it('renders loading state correctly', () => {
    render(<GymsList {...defaultProps} isLoading={true} />)
    expect(
      screen.getByTestId(
        GymsListTestIds.LOADING(defaultProps.testIdInstanceSuffix)
      )
    ).toBeInTheDocument()
  })

  it('renders error state correctly', () => {
    render(<GymsList {...defaultProps} error={new Error('Failed to load')} />)
    const errorState = screen.getByTestId(
      GymsListTestIds.ERROR(defaultProps.testIdInstanceSuffix)
    )
    expect(errorState).toBeInTheDocument()
    expect(
      within(errorState).getByText('Could not load gyms.')
    ).toBeInTheDocument()
  })

  it('renders empty state correctly if gyms array is empty or undefined', () => {
    render(<GymsList {...defaultProps} gyms={[]} />)
    const emptyState = screen.getByTestId(
      GymsListTestIds.EMPTY(defaultProps.testIdInstanceSuffix)
    )
    expect(emptyState).toBeInTheDocument()
    expect(within(emptyState).getByText('No gyms found.')).toBeInTheDocument()

    render(<GymsList {...defaultProps} gyms={undefined} />)
    expect(
      screen.getByTestId(
        GymsListTestIds.EMPTY(defaultProps.testIdInstanceSuffix)
      )
    ).toBeInTheDocument()
  })

  it('renders a list of GymCards when gyms are provided', () => {
    const gyms: GymDto[] = [MOCK_GYM_FULL, MOCK_GYM_MINIMAL]
    render(
      <GymsList
        {...defaultProps}
        gyms={gyms}
        data-testid={GymsListTestIds.ROOT(defaultProps.testIdInstanceSuffix)}
      />
    )

    expect(
      screen.getByTestId(
        GymsListTestIds.ROOT(defaultProps.testIdInstanceSuffix)
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId(
        GymsListTestIds.LOADING(defaultProps.testIdInstanceSuffix)
      )
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId(
        GymsListTestIds.ERROR(defaultProps.testIdInstanceSuffix)
      )
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId(
        GymsListTestIds.EMPTY(defaultProps.testIdInstanceSuffix)
      )
    ).not.toBeInTheDocument()

    gyms.forEach(gym => {
      const expectedGymCardTestId = GymsListTestIds.ITEM(
        gym.id || gym.name.replace(/\s+/g, '-').toLowerCase()
      )
      const gymCardElement = screen.getByTestId(expectedGymCardTestId)
      expect(gymCardElement).toBeInTheDocument()
      expect(gymCardElement).toHaveTextContent(
        `Mocked GymCard for: ${gym.name}`
      )

      // Verify that GymCard mock was called with the correct props
      expect(vi.mocked(GymCard)).toHaveBeenCalledWith(
        expect.objectContaining({
          gym: gym,
          'data-testid': expectedGymCardTestId,
          // testIdInstanceSuffix: gym.id || gym.name.replace(/\s+/g, '-').toLowerCase() // This prop was missing in GymsList
        }),
        expect.anything() // For the second argument (context) of functional components
      )
    })
  })

  it('passes testIdInstanceSuffix to GymCard (ensure GymsList is updated to do so)', () => {
    // NOTE: Your GymsList component was missing passing testIdInstanceSuffix to GymCard.
    // This test assumes GymsList is updated like:
    // <GymCard ... testIdInstanceSuffix={gym.id || gym.name.replace(/\s+/g, '-').toLowerCase()} />
    const gym = MOCK_GYM_FULL
    render(<GymsList {...defaultProps} gyms={[gym]} />)

    const gymCardInstanceSuffix =
      gym.id || gym.name.replace(/\s+/g, '-').toLowerCase()
    expect(vi.mocked(GymCard)).toHaveBeenCalledWith(
      expect.objectContaining({
        testIdInstanceSuffix: gymCardInstanceSuffix,
      }),
      expect.anything()
    )
  })

  it('uses provided root data-testid or defaults correctly', () => {
    const customRootId = 'custom-gyms-list-root'
    render(
      <GymsList
        {...defaultProps}
        gyms={[MOCK_GYM_FULL]}
        data-testid={customRootId}
      />
    )
    expect(screen.getByTestId(customRootId)).toBeInTheDocument()

    render(
      <GymsList
        {...defaultProps}
        gyms={[MOCK_GYM_FULL]}
        data-testid={undefined}
      />
    )
    expect(
      screen.getByTestId(
        GymsListTestIds.ROOT(defaultProps.testIdInstanceSuffix)
      )
    ).toBeInTheDocument()
  })
})
