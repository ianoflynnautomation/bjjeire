import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsList } from './../gym-list'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'
import { GymDto } from '../../../../types/gyms'
import { GymsListTestIds } from '../../../../constants/gymDataTestIds'

describe('GymsList Component', () => {
  describe('State Handling', () => {
    it('should render the loading state when isLoading is true', () => {
      // Arrange
      render(<GymsList isLoading={true} />)

      // Assert
      expect(screen.getByTestId(GymsListTestIds.LOADING())).toBeInTheDocument()
      expect(
        screen.queryByTestId(GymsListTestIds.ERROR())
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId(GymsListTestIds.ROOT())
      ).not.toBeInTheDocument()
    })

    it('should render the error state when an error is provided', () => {
      // Arrange
      render(<GymsList error={new Error('Failed to load')} />)

      // Act
      const errorContainer = screen.getByTestId(GymsListTestIds.ERROR())

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
      render(<GymsList gyms={gyms} />)

      // Act
      const emptyContainer = screen.getByTestId(GymsListTestIds.EMPTY())

      // Assert
      expect(
        within(emptyContainer).getByText(/No gyms found/i)
      ).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('should render the correct number of GymCard components', () => {
      // Arrange
      const gyms: GymDto[] = [MOCK_GYM_FULL, MOCK_GYM_MINIMAL]
      render(<GymsList gyms={gyms} />)

      // Act
      const listContainer = screen.getByTestId(GymsListTestIds.ROOT())
      const renderedCards = within(listContainer).getAllByRole('article')

      // Assert
      expect(renderedCards).toHaveLength(gyms.length)
    })

    //   it('should pass the correct data down to each GymCard', () => {
    //     // Arrange
    //     const gyms: GymDto[] = [MOCK_GYM_FULL];
    //     render(<GymsList gyms={gyms} />);

    //     // Act
    //     const expectedCardId = GymsListTestIds.ITEM(MOCK_GYM_FULL.id);
    //     const gymCard = screen.getByTestId(expectedCardId);

    //     expect(
    //       within(gymCard).getByRole('heading', { name: new RegExp(MOCK_GYM_FULL.name) })
    //     ).toBeInTheDocument();
    //   });
  })
})
