import { render, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymCard } from './../gym-card/gym-card'
import {
  MOCK_GYM_FULL,
  MOCK_GYM_MINIMAL,
  MOCK_GYM_NO_WEBSITE,
} from './mocks/gym.mock'
import { GymCardTestIds } from '../../../../constants/gymDataTestIds'

describe('GymCard Component', () => {
  describe('Positive Scenarios', () => {
    it('should render all sections with correct content for a full gym object', () => {
      // Arrange
      const rootTestId = GymCardTestIds.ROOT

      const { getByTestId } = render(
        <GymCard gym={MOCK_GYM_FULL} data-testid={rootTestId} />
      )
      const expectedAddress = `${MOCK_GYM_FULL.location.address} (${MOCK_GYM_FULL.location.venue})`

      // Act
      const card = getByTestId(rootTestId)
      const footer = within(card).getByTestId(
        GymCardTestIds.FOOTER.ROOT
      )

      // Assert
      expect(
        within(card).getByRole('heading', {
          name: `Gym name: ${MOCK_GYM_FULL.name}`,
          level: 3,
        })
      ).toBeInTheDocument()
      expect(within(card).getByText(MOCK_GYM_FULL.status)).toBeInTheDocument()
      expect(
        within(card).getByText(`${MOCK_GYM_FULL.county} County`)
      ).toBeInTheDocument()
      expect(
        within(card).getByRole('link', { name: expectedAddress })
      ).toBeInTheDocument()
      //expect(within(card).getByRole('link', { name: `Affiliated with ${MOCK_GYM_FULL.affiliation.name}` })).toBeInTheDocument();
      expect(
        within(footer).getByRole('link', { name: /Visit Website/i })
      ).toBeInTheDocument()
    })
  })

  describe('Negative Scenarios', () => {
    it('should render correctly with minimal gym data and hide optional sections', () => {
      // Arrange
      const rootTestId = GymCardTestIds.ROOT
      const { getByTestId } = render(
        <GymCard gym={MOCK_GYM_MINIMAL} data-testid={rootTestId} />
      )

      // Act
      const card = getByTestId(rootTestId)

      // Assert
      expect(
        within(card).getByRole('heading', {
          name: `Gym name: ${MOCK_GYM_MINIMAL.name}`,
          level: 3,
        })
      ).toBeInTheDocument()
      expect(within(card).getByText('Pending Approval')).toBeInTheDocument()
      expect(
        within(card).queryByText(/Affiliated with/i)
      ).not.toBeInTheDocument()
      expect(
        within(card).queryByRole('link', { name: /Visit Website/i })
      ).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should not render the website link if the website URL is missing', () => {
      // Arrange
      const rootTestId = GymCardTestIds.ROOT
      const { getByTestId } = render(
        <GymCard gym={MOCK_GYM_NO_WEBSITE} data-testid={rootTestId} />
      )

      // Act
      const card = getByTestId(rootTestId)

      // Assert
      expect(
        within(card).getByRole('heading', {
          name: `Gym name: ${MOCK_GYM_NO_WEBSITE.name}`,
          level: 3,
        })
      ).toBeInTheDocument()

      expect(
        within(card).queryByRole('link', { name: /Visit Website/i })
      ).not.toBeInTheDocument()
    })

    it('should correctly display a non-active status like "Pending Approval"', () => {
      // Arrange
      const rootTestId = GymCardTestIds.ROOT
      const { getByTestId } = render(
        <GymCard gym={MOCK_GYM_MINIMAL} data-testid={rootTestId} />
      )

      // Act
      const card = getByTestId(rootTestId)

      // Assert
      const statusBadge = within(card).getByTestId(
        GymCardTestIds.HEADER.STATUS_BADGE
      )
      expect(statusBadge).toHaveTextContent('Pending Approval')
      expect(statusBadge).not.toHaveTextContent('Active')
    })

    it('should render without an affiliation link if affiliation data is missing', () => {
      // Arrange
      const gymWithoutAffiliation = {
        ...MOCK_GYM_FULL,
        id: 'gym-no-affiliation',
        affiliation: undefined,
      }
      const rootTestId = GymCardTestIds.ROOT
      const { getByTestId } = render(
        <GymCard gym={gymWithoutAffiliation} data-testid={rootTestId} />
      )
      const card = getByTestId(rootTestId)

      // Assert
      expect(
        within(card).queryByText(/Affiliated with/i)
      ).not.toBeInTheDocument()

      expect(
        within(card).getByRole('heading', {
          name: `Gym name: ${gymWithoutAffiliation.name}`,
        })
      ).toBeInTheDocument()
    })
  })
})
