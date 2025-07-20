import { render, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsList } from './../gym-list'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'
import { GymDto } from '../../../../types/gyms'
import { GymsPageTestIds, GymCardTestIds } from '../../../../constants/gymDataTestIds'

describe('GymsList Component', () => {
  describe('State Handling', () => {
    it('should render the loading state when isLoading is true', () => {
      // Arrange
      const { getByTestId, queryByTestId } = render(
        <GymsList isLoading={true} />
      )
      // Assert
      expect(getByTestId(GymsPageTestIds.LIST_LOADING)).toBeInTheDocument()
      expect(queryByTestId(GymsPageTestIds.LIST_ERROR)).not.toBeInTheDocument()
      expect(queryByTestId(GymsPageTestIds.LIST)).not.toBeInTheDocument()
    })

    it('should render the error state when an error is provided', () => {
      // Arrange
      const { getByTestId } = render(
        <GymsList error={new Error('Failed to load')} />
      )

      // Act
      const errorContainer = getByTestId(GymsPageTestIds.LIST_ERROR)

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
      const emptyContainer = getByTestId(GymsPageTestIds.LIST_EMPTY)

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
      const { getByTestId } = render(<GymsList gyms={gyms} />)

      // Act
      const listContainer = getByTestId(GymsPageTestIds.LIST)
      const renderedCards = within(listContainer).getAllByTestId(GymsPageTestIds.LIST_ITEM)

      // Assert
      expect(renderedCards).toHaveLength(gyms.length)
    })

    it('should pass the correct data down to each GymCard', () => {
      // Arrange
      const gyms: GymDto[] = [MOCK_GYM_FULL]
      const { getByTestId } = render(<GymsList gyms={gyms} />)

      // Act

      const listContainer = getByTestId(GymsPageTestIds.LIST)
    
      const gymCard = within(listContainer).getByText(MOCK_GYM_FULL.name).closest('article')

      // Assert
      expect(gymCard).toBeInTheDocument()
      expect(
        within(gymCard!).getByTestId(GymCardTestIds.COUNTY)
      ).toHaveTextContent(`${MOCK_GYM_FULL.county} County`)
    })
  })
})
