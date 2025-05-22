import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GymHeader } from '../gym-card/gym-header'
import { GymCardTestIds } from '../../../../constants/gymDataTestIds'
import {
  getGymStatusLabel,
  getGymStatusColorScheme,
} from '../../../../utils/gymDisplayUtils'
import { MOCK_GYM_FULL } from './mocks/gym.mock'

// Mock Badge
vi.mock('../../../../components/ui/badge/badge', () => ({
  Badge: vi.fn(({ text, colorScheme, 'data-testid': dataTestId }) => (
    <div data-testid={dataTestId} className={colorScheme}>
      Mocked Badge: {text}
    </div>
  )),
}))

describe('GymHeader Component', () => {
  const defaultProps = {
    name: MOCK_GYM_FULL.name,
    county: MOCK_GYM_FULL.county,
    status: MOCK_GYM_FULL.status,
    imageUrl: MOCK_GYM_FULL.imageUrl,
    testIdInstanceSuffix: 'test-suffix-header',
  }

  beforeEach(() => {
    // Reset mocks if they have specific implementations per test
    ;(getGymStatusLabel as ReturnType<typeof vi.fn>).mockImplementation(
      status => `Mocked Status: ${status}`
    )
    ;(getGymStatusColorScheme as ReturnType<typeof vi.fn>).mockReturnValue(
      'mock-status-scheme'
    )
  })

  it('renders the gym name', () => {
    render(
      <GymHeader
        {...defaultProps}
        data-testid={GymCardTestIds.HEADER.ROOT(
          defaultProps.testIdInstanceSuffix
        )}
      />
    )
    expect(screen.getByText(defaultProps.name)).toBeInTheDocument()
    expect(
      screen.getByTestId(
        GymCardTestIds.HEADER.NAME(defaultProps.testIdInstanceSuffix)
      )
    ).toHaveTextContent(defaultProps.name)
  })

  it('renders the county', () => {
    render(
      <GymHeader
        {...defaultProps}
        data-testid={GymCardTestIds.HEADER.ROOT(
          defaultProps.testIdInstanceSuffix
        )}
      />
    )
    expect(
      screen.getByText(`${defaultProps.county} County`)
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(
        GymCardTestIds.HEADER.COUNTY(defaultProps.testIdInstanceSuffix)
      )
    ).toHaveTextContent(`${defaultProps.county} County`)
  })

  it('renders the status badge with correct text and scheme', () => {
    render(
      <GymHeader
        {...defaultProps}
        data-testid={GymCardTestIds.HEADER.ROOT(
          defaultProps.testIdInstanceSuffix
        )}
      />
    )
    const expectedStatusLabel = `Mocked Status: ${defaultProps.status}`
    const badgeElement = screen.getByTestId(
      GymCardTestIds.HEADER.STATUS_BADGE(defaultProps.testIdInstanceSuffix)
    )

    expect(badgeElement).toHaveTextContent(
      `Mocked Badge: ${expectedStatusLabel}`
    )
    expect(getGymStatusLabel).toHaveBeenCalledWith(defaultProps.status)
    expect(getGymStatusColorScheme).toHaveBeenCalledWith(defaultProps.status)
    expect(badgeElement).toHaveClass('mock-status-scheme')
  })

  it('renders the image if imageUrl is provided', () => {
    render(
      <GymHeader
        {...defaultProps}
        data-testid={GymCardTestIds.HEADER.ROOT(
          defaultProps.testIdInstanceSuffix
        )}
      />
    )
    const image = screen.getByAltText(
      `Exterior or interior of ${defaultProps.name}`
    )
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', defaultProps.imageUrl)
    expect(
      screen.getByTestId(
        GymCardTestIds.HEADER.IMAGE(defaultProps.testIdInstanceSuffix)
      )
    ).toBe(image)
  })

  it('does not render image if imageUrl is not provided', () => {
    render(
      <GymHeader
        {...defaultProps}
        imageUrl={undefined}
        data-testid={GymCardTestIds.HEADER.ROOT(
          defaultProps.testIdInstanceSuffix
        )}
      />
    )
    expect(
      screen.queryByTestId(
        GymCardTestIds.HEADER.IMAGE(defaultProps.testIdInstanceSuffix)
      )
    ).not.toBeInTheDocument()
  })

  it('uses provided data-testid for root or defaults correctly', () => {
    const customRootId = 'custom-header-root'
    render(<GymHeader {...defaultProps} data-testid={customRootId} />)
    expect(screen.getByTestId(customRootId)).toBeInTheDocument()

    render(<GymHeader {...defaultProps} data-testid={undefined} />)
    expect(
      screen.getByTestId(
        GymCardTestIds.HEADER.ROOT(defaultProps.testIdInstanceSuffix)
      )
    ).toBeInTheDocument()
  })

  it('handles unnamed gym gracefully', () => {
    render(
      <GymHeader
        {...defaultProps}
        name=""
        data-testid={GymCardTestIds.HEADER.ROOT(
          defaultProps.testIdInstanceSuffix
        )}
      />
    )
    expect(
      screen.getByTestId(
        GymCardTestIds.HEADER.NAME(defaultProps.testIdInstanceSuffix)
      )
    ).toHaveTextContent('Unnamed Gym')
    if (defaultProps.imageUrl) {
      expect(
        screen.getByAltText('Exterior or interior of Unnamed Gym')
      ).toBeInTheDocument()
    }
  })
})
