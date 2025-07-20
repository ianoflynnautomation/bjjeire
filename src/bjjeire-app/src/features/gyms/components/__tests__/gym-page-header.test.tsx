import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsPageHeader } from './../gym-page-header'
import { GymsPageTestIds } from '../../../../constants/gymDataTestIds'

describe('GymsPageHeader Component', () => {
  describe('Title Rendering', () => {
    it('should render the default title when no countyName is provided', () => {
      // Arrange
      const { getByTestId } = render(<GymsPageHeader />)

      // Act
      const titleElement = getByTestId(GymsPageTestIds.HEADER_TITLE)

      // Assert
      expect(titleElement).toHaveTextContent('All BJJ Gyms')
    })

    it('should render the default title if countyName is "all"', () => {
      // Arrange
      const { getByTestId } = render(<GymsPageHeader countyName="all" />)

      // Act
      const titleElement = getByTestId(GymsPageTestIds.HEADER_TITLE)

      // Assert
      expect(titleElement).toHaveTextContent('All BJJ Gyms')
    })

    it('should render the default title if countyName is "All" (case-insensitive)', () => {
      // Arrange
      const { getByTestId } = render(<GymsPageHeader countyName="All" />)

      // Act
      const titleElement = getByTestId(GymsPageTestIds.HEADER_TITLE)

      // Assert
      expect(titleElement).toHaveTextContent('All BJJ Gyms')
    })

    it('should render a county-specific title when a countyName is provided', () => {
      // Arrange
      const county = 'Dublin'
      const { getByTestId } = render(<GymsPageHeader countyName={county} />)

      // Act
      const titleElement = getByTestId(GymsPageTestIds.HEADER_TITLE)

      // Assert
      expect(titleElement).toHaveTextContent(`BJJ Gyms in ${county}`)
    })
  })

  describe('Total Count Display', () => {
    it('should not render the total count element if totalGyms is undefined', () => {
      // Arrange
      const { queryByTestId } = render(<GymsPageHeader />)

      // Assert
      expect(
        queryByTestId(GymsPageTestIds.HEADER_TOTAL)
      ).not.toBeInTheDocument()
    })

    it('should not render the total count element if totalGyms is 0', () => {
      // Arrange
      const { queryByTestId } = render(<GymsPageHeader totalGyms={0} />)

      // Assert
      expect(
        queryByTestId(GymsPageTestIds.HEADER_TOTAL)
      ).not.toBeInTheDocument()
    })

    it('should render the correct singular text for a single gym', () => {
      // Arrange
      const total = 1
      const { getByTestId } = render(<GymsPageHeader totalGyms={total} />)

      // Act
      const totalElement = getByTestId(GymsPageTestIds.HEADER_TOTAL)

      // Assert
      expect(totalElement).toHaveTextContent(`Found ${total} gym.`)
    })

    it('should render the correct plural text for multiple gyms', () => {
      // Arrange
      const total = 5
      const { getByTestId } = render(<GymsPageHeader totalGyms={total} />)

      // Act
      const totalElement = getByTestId(GymsPageTestIds.HEADER_TOTAL)

      // Assert
      expect(totalElement).toHaveTextContent(`Found ${total} gyms.`)
    })
  })

  describe('Data Attributes', () => {
    it('should apply a custom data-testid to the root element if provided', () => {
      // Arrange
      const customId = 'my-custom-header'
      const { getByTestId } = render(<GymsPageHeader data-testid={customId} />)

      // Assert
      expect(getByTestId(customId)).toBeInTheDocument()
    })
  })
})
