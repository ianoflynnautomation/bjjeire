import { render, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsList } from './../gym-list'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'
import { GymDto } from '../../../../types/gyms'
import { GymsListTestIds } from '../../../../constants/gymDataTestIds'

describe('GymsList Component', () => {
  describe('State Handling', () => {
    it('should render the loading state when isLoading is true', () => {
      // Arrange
      const { getByTestId, queryByTestId } = render(
        <GymsList isLoading={true} />
      )
      // Assert
      expect(getByTestId(GymsListTestIds.LOADING)).toBeInTheDocument()
      expect(queryByTestId(GymsListTestIds.ERROR)).not.toBeInTheDocument()
      expect(queryByTestId(GymsListTestIds.ROOT)).not.toBeInTheDocument()
    })

    it('should render the error state when an error is provided', () => {
      // Arrange
      const { getByTestId } = render(
        <GymsList error={new Error('Failed to load')} />
      )

      // Act
      const errorContainer = getByTestId(GymsListTestIds.ERROR)

      // Assert
      expect(
        within(errorContainer).getByText(/Could not load gyms/i)
      ).toBeInTheDocument()
    })

    it.each([
      { case: 'an empty array', gyms: [] },
      { case: 'undefined', gyms: undefined },
    ])('should render the empty state when gyms prop is $case', ({ gyms }) => {
      // Arrange
      const { getByTestId } = render(<GymsList gyms={gyms} />)

      // Act
      const emptyContainer = getByTestId(GymsListTestIds.EMPTY)

      // Assert
      expect(
        within(emptyContainer).getByText(/No gyms found/i)
      ).toBeInTheDocument()
    })
  })

  describe.concurrent('Data Display', () => {
    it('should render the correct number of GymCard components', () => {
      // Arrange
      const gyms: GymDto[] = [MOCK_GYM_FULL, MOCK_GYM_MINIMAL]
      const { getByTestId } = render(<GymsList gyms={gyms} />)

      // Act
      const listContainer = getByTestId(GymsListTestIds.ROOT)
      const renderedCards = within(listContainer).getAllByRole('article')

      // Assert
      expect(renderedCards).toHaveLength(gyms.length)
    })

    // it('should pass the correct data down to each GymCard', () => {
    //       // Arrange
    //       const gyms: GymDto[] = [MOCK_GYM_FULL]
    //       const { getByTestId } = render(<GymsList gyms={gyms} />)

    //       // Act
    //       // Find a specific card by the test ID that GymsList assigns to it.
    //       const expectedCardId = GymsListTestIds.ITEM(MOCK_GYM_FULL.id)
    //       const gymCard = getByTestId(expectedCardId)

    //       // Assert: Spot-check that the data was passed down correctly by finding the name inside that card.
    //       // This query is precise and robust.
    //       expect(
    //         within(gymCard).getByRole('heading', { name: `Gym name: ${MOCK_GYM_FULL.name}` })
    //       ).toBeInTheDocument()
    //     })
  })
})
