import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsList } from './../gym-list'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'
import type { GymDto } from '@/types/gyms'
import { GymCardTestIds } from '@/constants/gymDataTestIds'

describe('GymsList Component', () => {
  describe('Data Display', () => {
    it('should render the correct number of GymCard components', () => {
      const gyms: GymDto[] = [MOCK_GYM_FULL, MOCK_GYM_MINIMAL]
      const { container } = render(<GymsList gyms={gyms} />)
      const renderedCards = container.querySelectorAll('article')

      expect(renderedCards).toHaveLength(gyms.length)
    })

    it('should pass the correct data down to each GymCard', () => {
      const gyms: GymDto[] = [MOCK_GYM_FULL]
      render(<GymsList gyms={gyms} />)
      const gymTitle = screen.getByRole('heading', {
        name: new RegExp(`gym name: ${MOCK_GYM_FULL.name}`, 'i'),
        level: 3,
      })
      const gymCard = gymTitle.closest('article')

      expect(gymCard).toBeInTheDocument()
      expect(
        within(gymCard!).getByTestId(GymCardTestIds.COUNTY)
      ).toHaveTextContent(`${MOCK_GYM_FULL.county} County`)
    })
  })
})
