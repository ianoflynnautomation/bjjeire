import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymOfferedClasses } from './../gym-card/gym-offered-classes'
import { ClassCategory } from '../../../../types/gyms'

describe('GymOfferedClasses Component', () => {
  it('should render nothing if the classes array is empty or undefined', () => {
    const { container: containerEmpty } = render(<GymOfferedClasses classes={[]} />)
    expect(containerEmpty).toBeEmptyDOMElement()

    const { container: containerUndefined } = render(
      <GymOfferedClasses classes={undefined} />
    )
    expect(containerUndefined).toBeEmptyDOMElement()
  })

  it('should render a list of class labels when classes are provided', () => {
    const classes = [
      ClassCategory.BJJGiAllLevels,
      ClassCategory.Wrestling,
      ClassCategory.KidsBJJ,
    ]
    render(<GymOfferedClasses classes={classes} />)

    expect(screen.getByText('BJJ Gi (All Levels)')).toBeInTheDocument()
    expect(screen.getByText('Wrestling')).toBeInTheDocument()
    expect(screen.getByText('Kids BJJ')).toBeInTheDocument()

    const section = screen.getByText('BJJ Gi (All Levels)').closest('div[aria-label="Offered Classes"]')
    expect(section).toBeInTheDocument()
  })

  it('should not render a label for a class that is not in the list', () => {
    const classes = [ClassCategory.BJJGiAllLevels, ClassCategory.Wrestling]
    render(<GymOfferedClasses classes={classes} />)

    expect(screen.queryByText('Kids BJJ')).not.toBeInTheDocument()
  })
})
