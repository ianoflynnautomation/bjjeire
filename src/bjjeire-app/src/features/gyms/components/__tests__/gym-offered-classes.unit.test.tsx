import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymOfferedClasses } from './../gym-card/gym-offered-classes'
import { ClassCategory } from '@/types/gyms'
import { getClassCategoryLabel } from '@/utils/gym-display-utils'

describe('GymOfferedClasses', () => {
  it.each([
    { classes: undefined, case: 'undefined' },
    { classes: [], case: 'empty' },
  ])(
    'given a $case classes list, when the component renders, then nothing is shown',
    ({ classes }) => {
      const { container } = render(<GymOfferedClasses classes={classes} />)

      expect(container).toBeEmptyDOMElement()
    }
  )

  it('given a list of classes, when the component renders, then a label is shown for each class and no others', () => {
    const mockClasses = [
      ClassCategory.BJJGiAllLevels,
      ClassCategory.Wrestling,
      ClassCategory.KidsBJJ,
    ]
    render(<GymOfferedClasses classes={mockClasses} />)
    const offeredClassesSection = screen.getByLabelText('Offered Classes')

    mockClasses.forEach(category => {
      const expectedLabel = getClassCategoryLabel(category)
      expect(
        within(offeredClassesSection).getByText(expectedLabel)
      ).toBeInTheDocument()
    })
    expect(
      within(offeredClassesSection).queryByText(
        getClassCategoryLabel(ClassCategory.BJJNoGiAllLevels)
      )
    ).not.toBeInTheDocument()
  })
})
