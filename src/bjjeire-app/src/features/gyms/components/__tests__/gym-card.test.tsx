import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GymCard } from './../gym-card/gym-card'
import { GymCardTestIds } from '../../../../constants/gymDataTestIds'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'

vi.mock('./GymHeader', () => ({
  GymHeader: vi.fn(({ name, county, status, 'data-testid': testId }) => (
    <div data-testid={testId}>
      Mocked GymHeader: {name}
      <span>MockStatusLabel({status})</span>
      {county}
    </div>
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
    gym.id ||
    (gym.name ? gym.name.replace(/\s+/g, '-').toLowerCase() : 'default')

  it('renders GymHeader, GymDetails, and GymFooter with correct props and testIds', () => {
    const gym = MOCK_GYM_FULL
    const instanceSuffix = getSuffix(gym)
    const rootTestId = `gym-list-item-${gym.id}`

    render(<GymCard gym={gym} data-testid={rootTestId} />)

    // Check root GymCard testId and classes
    const card = screen.getByTestId(rootTestId)
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('flex', 'h-full', 'flex-col', 'rounded-lg')

    // Check GymHeader
    const headerTestId = GymCardTestIds.HEADER.ROOT(instanceSuffix)
    const header = screen.getByTestId(headerTestId)
    expect(header).toBeInTheDocument()
    expect(header).toHaveTextContent(gym.name)
    expect(header).toHaveTextContent(gym.status)
    expect(header).toHaveTextContent(gym.county)

    // Check GymDetails
    const detailsTestId = GymCardTestIds.DETAILS.ROOT(instanceSuffix)
    const details = screen.getByTestId(detailsTestId)
    expect(details).toBeInTheDocument()
    expect(details).toHaveTextContent(`Mocked GymDetails for: ${gym.name}`)

    // Check GymFooter
    const footerTestId = GymCardTestIds.FOOTER.ROOT(instanceSuffix)
    const footer = screen.getByTestId(footerTestId)
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveTextContent(`Mocked GymFooter for: ${gym.name}`)
  })

  it('uses default root testId if data-testid prop is not provided', () => {
    const gym = MOCK_GYM_MINIMAL
    const instanceSuffix = getSuffix(gym)
    render(<GymCard gym={gym} />)
    expect(
      screen.getByTestId(GymCardTestIds.ROOT(instanceSuffix))
    ).toBeInTheDocument()
  })

  it('passes correct props to GymHeader', () => {
    const gym = MOCK_GYM_FULL
    const instanceSuffix = getSuffix(gym)
    render(<GymCard gym={gym} data-testid="gym-list-item-test" />)
    expect(vi.mocked(require('./GymHeader').GymHeader)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: gym.name,
        county: gym.county,
        status: gym.status,
        imageUrl: gym.imageUrl,
        'data-testid': GymCardTestIds.HEADER.ROOT(instanceSuffix),
        testIdInstanceSuffix: instanceSuffix,
      }),
      expect.anything()
    )
  })
})
