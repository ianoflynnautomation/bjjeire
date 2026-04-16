import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymOfferedClasses } from './../gym-card/gym-offered-classes'
import { ClassCategory } from '@/types/gyms'
import { getClassCategoryLabel } from '@/utils/gym-display-utils'

describe('GymOfferedClasses Component', () => {
  describe('Rendering Logic', () => {
    it('should render nothing if the classes array is undefined', () => {
      const { container } = render(<GymOfferedClasses classes={undefined} />)

      expect(container).toBeEmptyDOMElement()
    })

    it('should render nothing if the classes array is empty', () => {
      const { container } = render(<GymOfferedClasses classes={[]} />)

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
      render(<GymOfferedClasses classes={mockClasses} />)
      const offeredClassesSection = screen.getByLabelText('Offered Classes')

      mockClasses.forEach(category => {
        const expectedLabel = getClassCategoryLabel(category)
        expect(
          within(offeredClassesSection).getByText(expectedLabel)
        ).toBeInTheDocument()
      })
    })

    it('should not render a label for a class that is not provided', () => {
      const subsetOfClasses = [ClassCategory.BJJGiAllLevels]
      render(<GymOfferedClasses classes={subsetOfClasses} />)
      const offeredClassesSection = screen.getByLabelText('Offered Classes')
      const missingLabel = getClassCategoryLabel(ClassCategory.KidsBJJ)

      expect(
        within(offeredClassesSection).queryByText(missingLabel)
      ).not.toBeInTheDocument()
    })
  })
})
