import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GymOfferedClasses } from './../gym-card/gym-offered-classes'
import { GymOfferedClassesTestIds } from '../../../../constants/gymDataTestIds' // Assuming GymCardTestIds might be used by DetailItem
import { ClassCategory } from '../../../../types/gyms'
import { getClassCategoryLabel } from '../../../../utils/gymDisplayUtils' // Will use mocked version
import { withTestIdSuffix } from '../../../../constants/commonDataTestIds' // Assuming this is the correct import for the component

// Mock DetailItem to focus on GymOfferedClasses logic
vi.mock('../../../../components/ui/icons/detail-item', () => ({
  // Adjust path
  DetailItem: vi.fn(
    ({
      children,
      'data-testid': dtId,
      icon,
      ariaLabel,
      testIdInstanceSuffix: suffix,
    }) => (
      <div data-testid={dtId} aria-label={ariaLabel}>
        <div data-testid={`mock-detail-item-icon-${suffix}`}>{icon}</div>
        <div data-testid={`mock-detail-item-content-${suffix}`}>{children}</div>
      </div>
    )
  ),
}))

describe('GymOfferedClasses Component', () => {
  const defaultProps = {
    testIdInstanceSuffix: 'test-suffix-classes',
  }

  it('renders nothing if classes array is empty or undefined', () => {
    const { container: containerEmpty } = render(
      <GymOfferedClasses {...defaultProps} classes={[]} />
    )
    expect(containerEmpty.firstChild).toBeNull()

    const { container: containerUndefined } = render(
      <GymOfferedClasses {...defaultProps} classes={undefined} />
    )
    expect(containerUndefined.firstChild).toBeNull()
  })

  it('renders DetailItem with correct props when classes are provided', () => {
    const classes = [ClassCategory.BJJGiAllLevels, ClassCategory.Wrestling]
    render(
      <GymOfferedClasses
        {...defaultProps}
        classes={classes}
        data-testid={GymOfferedClassesTestIds.ROOT(
          defaultProps.testIdInstanceSuffix
        )}
      />
    )
    const detailItem = screen.getByTestId(
      GymOfferedClassesTestIds.ROOT(defaultProps.testIdInstanceSuffix)
    )
    expect(detailItem).toBeInTheDocument()
    expect(detailItem).toHaveAttribute('aria-label', 'Offered Classes')
    // Check if DetailItem mock received the correct testIdInstanceSuffix for its internal parts
    expect(
      screen.getByTestId(
        `mock-detail-item-content-${defaultProps.testIdInstanceSuffix}`
      )
    ).toBeInTheDocument()
  })

  it('renders each class category with correct label and testId', () => {
    const classes = [ClassCategory.BJJGiAllLevels, ClassCategory.Wrestling]
    ;(getClassCategoryLabel as ReturnType<typeof vi.fn>).mockImplementation(
      cat => `Label for ${cat}`
    )

    render(<GymOfferedClasses {...defaultProps} classes={classes} />)

    const contentArea = screen.getByTestId(
      `mock-detail-item-content-${defaultProps.testIdInstanceSuffix}`
    )

    classes.forEach(category => {
      const expectedLabel = `Label for ${category}`
      const classSpan = within(contentArea).getByText(expectedLabel)
      expect(classSpan).toBeInTheDocument()
      // Assuming GymOfferedClassesTestIds.ITEM(category) returns the base part of the ID
      // and withTestIdSuffix appends the instance suffix.
      expect(classSpan).toHaveAttribute(
        'data-testid',
        withTestIdSuffix(
          GymOfferedClassesTestIds.ITEM(category),
          defaultProps.testIdInstanceSuffix
        )
      )
      expect(getClassCategoryLabel).toHaveBeenCalledWith(category)
    })
  })
})
