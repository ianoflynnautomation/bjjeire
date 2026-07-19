import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventHeader } from '../event-card/event-header'
import { BjjEventType } from '@/types/event'
import { getEventTypeLabel } from '@/utils/event-utils'
import { County } from '@/constants/counties'

describe('EventHeader', () => {
  const defaultProps = {
    name: 'Dublin Open Mat',
    types: [BjjEventType.OpenMat],
    county: County.Dublin,
  }

  it('given a named event, when the header renders, then the name, type badge and county are shown', () => {
    render(<EventHeader {...defaultProps} />)

    expect(
      screen.getByRole('heading', {
        name: /dublin open mat/i,
        level: 3,
      })
    ).toBeInTheDocument()

    expect(
      screen.getByText(getEventTypeLabel(BjjEventType.OpenMat))
    ).toBeInTheDocument()

    expect(
      screen.getByText('Dublin County', { selector: 'span' })
    ).toBeInTheDocument()
  })

  it('given an event with multiple types, when the header renders, then one badge is shown per type', () => {
    render(
      <EventHeader
        {...defaultProps}
        types={[BjjEventType.Camp, BjjEventType.OpenMat]}
        name="Leinster Summer Camp"
      />
    )

    expect(
      screen.getByText(getEventTypeLabel(BjjEventType.Camp))
    ).toBeInTheDocument()
    expect(
      screen.getByText(getEventTypeLabel(BjjEventType.OpenMat))
    ).toBeInTheDocument()
  })

  it('given an event with no types, when the header renders, then no badges are shown', () => {
    render(<EventHeader {...defaultProps} types={[]} />)

    expect(
      screen.queryByText(getEventTypeLabel(BjjEventType.OpenMat))
    ).not.toBeInTheDocument()
  })

  it('given an empty event name, when the header renders, then a fallback name is shown', () => {
    render(<EventHeader {...defaultProps} name="" />)

    expect(
      screen.getByRole('heading', {
        name: /unnamed event/i,
        level: 3,
      })
    ).toBeInTheDocument()
  })

  it('given a county, when the header renders, then the county is shown with its suffix', () => {
    render(<EventHeader {...defaultProps} county={County.Cork} />)

    expect(
      screen.getByText('Cork County', { selector: 'span' })
    ).toBeInTheDocument()
  })
})
