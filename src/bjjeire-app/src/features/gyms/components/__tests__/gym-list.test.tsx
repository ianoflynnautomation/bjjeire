import { render, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsList } from './../gym-list'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'
import type { GymDto } from '@/types/gyms'
import { GymsPageTestIds, GymCardTestIds } from '@/constants/gymDataTestIds'

describe('GymsList Component', () => {
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
