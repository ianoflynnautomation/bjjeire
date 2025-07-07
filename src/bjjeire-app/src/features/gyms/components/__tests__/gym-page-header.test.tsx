import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsPageHeader } from './../gym-page-header'
import { GymsPageHeaderTestIds } from '../../../../constants/gymDataTestIds'

describe('GymsPageHeader Component', () => {
  describe('Title Rendering', () => {
    it('should render the default title when no countyName is provided', () => {
      // Arrange
      render(<GymsPageHeader />)

      // Act
      const titleElement = screen.getByTestId(GymsPageHeaderTestIds.TITLE())

      // Assert
      expect(titleElement).toHaveTextContent('All BJJ Gyms')
    })

    it('should render the default title if countyName is "all"', () => {
      // Arrange
      render(<GymsPageHeader countyName="all" />)

      // Act
      const titleElement = screen.getByTestId(GymsPageHeaderTestIds.TITLE())

      // Assert
      expect(titleElement).toHaveTextContent('All BJJ Gyms')
    })

    it('should render the default title if countyName is "All" (case-insensitive)', () => {
      // Arrange
      render(<GymsPageHeader countyName="All" />)

      // Act
      const titleElement = screen.getByTestId(GymsPageHeaderTestIds.TITLE())

      // Assert
      expect(titleElement).toHaveTextContent('All BJJ Gyms')
    })

    it('should render a county-specific title when a countyName is provided', () => {
      // Arrange
      const county = 'Dublin'
      render(<GymsPageHeader countyName={county} />)

      // Act
      const titleElement = screen.getByTestId(GymsPageHeaderTestIds.TITLE())

      // Assert
      expect(titleElement).toHaveTextContent(`BJJ Gyms in ${county}`)
    })
  })

  describe('Total Count Display', () => {
    it('should not render the total count element if totalGyms is undefined', () => {
      // Arrange
      render(<GymsPageHeader />)

      // Assert
      expect(
        screen.queryByTestId(GymsPageHeaderTestIds.TOTAL())
      ).not.toBeInTheDocument()
    })

    it('should not render the total count element if totalGyms is 0', () => {
      // Arrange
      render(<GymsPageHeader totalGyms={0} />)

      // Assert
      expect(
        screen.queryByTestId(GymsPageHeaderTestIds.TOTAL())
      ).not.toBeInTheDocument()
    })

    it('should render the correct singular text for a single gym', () => {
      // Arrange
      const total = 1
      render(<GymsPageHeader totalGyms={total} />)

      // Act
      const totalElement = screen.getByTestId(GymsPageHeaderTestIds.TOTAL())

      // Assert
      expect(totalElement).toHaveTextContent(`Found ${total} gym.`)
    })

    it('should render the correct plural text for multiple gyms', () => {
      // Arrange
      const total = 5
      render(<GymsPageHeader totalGyms={total} />)

      // Act
      const totalElement = screen.getByTestId(GymsPageHeaderTestIds.TOTAL())

      // Assert
      expect(totalElement).toHaveTextContent(`Found ${total} gyms.`)
    })
  })

  describe('Data Attributes', () => {
    it('should apply a custom data-testid to the root element if provided', () => {
      // Arrange
      const customId = 'my-custom-header'
      render(<GymsPageHeader data-testid={customId} />)

      // Assert
      expect(screen.getByTestId(customId)).toBeInTheDocument()
    })
  })
})
