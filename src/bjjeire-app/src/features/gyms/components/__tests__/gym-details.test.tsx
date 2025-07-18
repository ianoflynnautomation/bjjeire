import { render, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GymDetails } from '../gym-card/gym-details'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'

vi.mock('../../../../utils/mapUtils')
vi.mock('../../../../components/ui/social-media/social-media-links', () => ({
  SocialMediaLinks: vi.fn(() => <div data-testid="mock-social-media" />),
}))

describe.concurrent('With Full Data', () => {
  it('should render all sections correctly', () => {
    //
    const { container } = render(
      <GymDetails gym={MOCK_GYM_FULL} />
    )

    // Act
    const { getByLabelText, getByTestId } = within(container)

    // Assert
    expect(getByLabelText(/Location:/)).toBeInTheDocument()
    expect(getByLabelText(/Affiliation:/)).toBeInTheDocument()
    expect(getByLabelText(/Timetable:/)).toBeInTheDocument()
    expect(getByTestId('mock-social-media')).toBeInTheDocument()
  })
})

describe.concurrent('With Minimal Data', () => {
  it('should hide sections when their data is missing', () => {
    // Arrange
    const { container } = render(<GymDetails gym={MOCK_GYM_MINIMAL} />)

    // Act
    const { getByLabelText, getByTestId, queryByLabelText } = within(container)

    // Assert
    expect(getByLabelText(/Location:/)).toBeInTheDocument()
    expect(getByTestId('mock-social-media')).toBeInTheDocument()
    expect(queryByLabelText(/Affiliation:/)).not.toBeInTheDocument()
    expect(queryByLabelText(/Timetable:/)).not.toBeInTheDocument()
  })
})
