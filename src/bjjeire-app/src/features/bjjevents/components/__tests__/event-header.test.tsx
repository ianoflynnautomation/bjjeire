import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventHeader } from '../event-card/event-header'
import { BjjEventType } from '@/types/event'
import { getEventTypeLabel } from '@/utils/event-utils'
import { County } from '@/constants/counties'

describe('EventHeader Component', () => {
  const defaultProps = {
    name: 'Dublin Open Mat',
    type: BjjEventType.OpenMat,
    county: County.Dublin,
  }

  describe('Display Logic', () => {
    it('should render the name, type badge, and county correctly', () => {
      render(<EventHeader {...defaultProps} />)

      expect(
        screen.getByRole('heading', {
          name: /event name: dublin open mat/i,
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

    it('should render different event type labels correctly', () => {
      render(
        <EventHeader
          {...defaultProps}
          type={BjjEventType.Tournament}
          name="Leinster Championship"
        />
      )

      expect(
        screen.getByText(getEventTypeLabel(BjjEventType.Tournament))
      ).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should display a fallback name when name is empty', () => {
      render(<EventHeader {...defaultProps} name="" />)

      expect(
        screen.getByRole('heading', {
          name: /event name: unnamed event/i,
          level: 3,
        })
      ).toBeInTheDocument()
    })

    it('should display the correct county with suffix', () => {
      render(<EventHeader {...defaultProps} county={County.Cork} />)

      expect(
        screen.getByText('Cork County', { selector: 'span' })
      ).toBeInTheDocument()
    })
  })
})
