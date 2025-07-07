import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymOfferedClasses } from './../gym-card/gym-offered-classes'
import { ClassCategory } from '../../../../types/gyms'
import { getClassCategoryLabel } from '../../../../utils/gymDisplayUtils'

describe('GymOfferedClasses Component', () => {
  describe('Rendering Logic', () => {
    it('should render nothing if the classes array is undefined', () => {
      // Arrange
      const { container } = render(<GymOfferedClasses classes={undefined} />)
      // Assert
      expect(container).toBeEmptyDOMElement()
    })

    it('should render nothing if the classes array is empty', () => {
      // Arrange
      const { container } = render(<GymOfferedClasses classes={[]} />)
      // Assert
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('Content and Accessibility', () => {
    const mockClasses = [
      ClassCategory.BJJGiAllLevels,
      ClassCategory.Wrestling,
      ClassCategory.KidsBJJ,
    ]

    it('should render the correct labels for a given list of classes', () => {
      // Arrange
      render(<GymOfferedClasses classes={mockClasses} />)

      // Act
      const offeredClassesSection = screen.getByLabelText('Offered Classes')

      // Assert
      mockClasses.forEach(category => {
        const expectedLabel = getClassCategoryLabel(category)
        expect(
          within(offeredClassesSection).getByText(expectedLabel)
        ).toBeInTheDocument()
      })
    })

    it('should not render a label for a class that is not provided', () => {
      // Arrange
      const subsetOfClasses = [ClassCategory.BJJGiAllLevels]
      render(<GymOfferedClasses classes={subsetOfClasses} />)

      // Act
      const offeredClassesSection = screen.getByLabelText('Offered Classes')
      const missingLabel = getClassCategoryLabel(ClassCategory.KidsBJJ)

      // Assert
      expect(
        within(offeredClassesSection).queryByText(missingLabel)
      ).not.toBeInTheDocument()
    })
  })
})
