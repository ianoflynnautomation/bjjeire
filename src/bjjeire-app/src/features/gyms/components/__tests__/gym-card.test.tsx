import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GymCard } from './../gym-card/gym-card'
import { GymCardTestIds } from '../../../../constants/gymDataTestIds'
import {
  MOCK_GYM_FULL,
  MOCK_GYM_MINIMAL,
  MOCK_GYM_NO_WEBSITE,
} from './mocks/gym.mock'

// Mock child components to verify props passed and their presence
vi.mock('./GymHeader', () => ({
  GymHeader: vi.fn(props => (
    <div data-testid={props['data-testid']}>Mocked GymHeader: {props.name}</div>
  )),
}))
vi.mock('./GymDetails', () => ({
  GymDetails: vi.fn(props => (
    <div data-testid={props['data-testid']}>
      Mocked GymDetails for: {props.gym.name}
    </div>
  )),
}))
vi.mock('./GymFooter', () => ({
  GymFooter: vi.fn(props => (
    <div data-testid={props['data-testid']}>
      Mocked GymFooter for: {props.gymName}
    </div>
  )),
}))

describe('GymCard Component', () => {
  const getSuffix = (gym: typeof MOCK_GYM_FULL) =>
    gym.id || gym.name.replace(/\s+/g, '-').toLowerCase()

  it('renders GymHeader, GymDetails, and GymFooter with correct props and testIds', () => {
    const gym = MOCK_GYM_FULL
    const instanceSuffix = getSuffix(gym)
    const rootTestIdPassedToCard = `gym-list-item-${gym.id}`

    render(<GymCard gym={gym} data-testid={rootTestIdPassedToCard} />)

    // Check root GymCard testId
    expect(screen.getByTestId(rootTestIdPassedToCard)).toBeInTheDocument()

    // Check GymHeader
    const headerTestId = GymCardTestIds.HEADER.ROOT(instanceSuffix)
    expect(screen.getByTestId(headerTestId)).toBeInTheDocument()
    expect(screen.getByTestId(headerTestId)).toHaveTextContent(
      `Mocked GymHeader: ${gym.name}`
    )

    // Check GymDetails
    const detailsTestId = GymCardTestIds.DETAILS.ROOT(instanceSuffix)
    expect(screen.getByTestId(detailsTestId)).toBeInTheDocument()
    expect(screen.getByTestId(detailsTestId)).toHaveTextContent(
      `Mocked GymDetails for: ${gym.name}`
    )

    // Check GymFooter
    const footerTestId = GymCardTestIds.FOOTER.ROOT(instanceSuffix)
    expect(screen.getByTestId(footerTestId)).toBeInTheDocument()
    expect(screen.getByTestId(footerTestId)).toHaveTextContent(
      `Mocked GymFooter for: ${gym.name}`
    )
  })

  it('uses default root testId if data-testid prop is not provided', () => {
    const gym = MOCK_GYM_MINIMAL
    const instanceSuffix = getSuffix(gym)
    render(<GymCard gym={gym} />)
    expect(
      screen.getByTestId(GymCardTestIds.ROOT(instanceSuffix))
    ).toBeInTheDocument()
  })

  it('does not render GymFooter if website is not provided', () => {
    const gym = MOCK_GYM_NO_WEBSITE
    const instanceSuffix = getSuffix(gym)
    render(<GymCard gym={gym} />)
    expect(
      screen.queryByTestId(GymCardTestIds.FOOTER.ROOT(instanceSuffix))
    ).not.toBeInTheDocument()
  })
})
