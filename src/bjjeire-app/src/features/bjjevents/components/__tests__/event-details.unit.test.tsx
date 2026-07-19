import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventDetails } from '../event-card/event-details'
import { MOCK_EVENT_FULL, MOCK_EVENT_MINIMAL } from './mocks/bjjevent.mocks'
import type { BjjEventDto } from '@/types/event'
import { BjjEventType, EventStatus, PricingType } from '@/types/event'
import { County } from '@/constants/counties'

const baseEvent = {
  id: 'test-id',
  name: 'Test Event',
  types: [BjjEventType.OpenMat],
  county: County.Dublin,
  status: EventStatus.Upcoming,
} as BjjEventDto

describe('EventDetails', () => {
  describe('Organiser', () => {
    it('given an organiser with a website, when details render, then the organiser is a safe external link', () => {
      render(<EventDetails event={MOCK_EVENT_FULL} />)
      const link = screen.getByRole('link', {
        name: /visit organiser website for dublin open mat/i,
      })
      expect(link).toHaveAttribute('href', 'https://grapplingireland.ie')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('given an organiser without a website, when details render, then the organiser is plain text', () => {
      render(<EventDetails event={MOCK_EVENT_MINIMAL} />)
      expect(
        screen.queryByRole('link', { name: /visit organiser website/i })
      ).not.toBeInTheDocument()
      expect(screen.getByText(/Organised by: Cork BJJ/)).toBeInTheDocument()
    })

    it('given no organiser, when details render, then the organiser section is hidden', () => {
      render(<EventDetails event={{ ...baseEvent }} />)
      expect(screen.queryByText(/Organised by/i)).not.toBeInTheDocument()
    })
  })

  describe('Location', () => {
    it('given a location, when details render, then a Google Maps link is shown', () => {
      render(<EventDetails event={MOCK_EVENT_FULL} />)
      const link = screen.getByRole('link', {
        name: /view dublin open mat location on google maps/i,
      })
      expect(link).toBeInTheDocument()
    })

    it('given no location, when details render, then the map link is hidden', () => {
      render(<EventDetails event={{ ...baseEvent }} />)
      expect(
        screen.queryByRole('link', { name: /location on google maps/i })
      ).not.toBeInTheDocument()
    })
  })

  describe('Pricing', () => {
    it('given a free event, when details render, then "Free" is shown', () => {
      render(<EventDetails event={MOCK_EVENT_FULL} />)
      expect(screen.getByText('Free')).toBeInTheDocument()
    })

    it('given a flat-rate event, when details render, then the price amount is shown', () => {
      render(<EventDetails event={MOCK_EVENT_MINIMAL} />)
      // MOCK_EVENT_MINIMAL has amount: 40 EUR FlatRate
      expect(screen.getByText(/EUR 40\.00/)).toBeInTheDocument()
    })

    it('given multiple pricing options, when details render, then one labelled row is shown per option', () => {
      render(
        <EventDetails
          event={{
            ...MOCK_EVENT_FULL,
            types: [BjjEventType.Camp, BjjEventType.OpenMat],
            pricingOptions: [
              {
                type: PricingType.FlatRate,
                label: 'Full camp',
                amount: 275,
                currency: 'EUR',
              },
              {
                type: PricingType.PerDay,
                label: 'Day pass',
                appliesToTypes: [BjjEventType.OpenMat],
                amount: 110,
                durationDays: 1,
                currency: 'EUR',
              },
            ],
          }}
        />
      )
      expect(screen.getByText('Full camp: EUR 275.00')).toBeInTheDocument()
      expect(
        screen.getByText('Day pass: EUR 110.00 per day')
      ).toBeInTheDocument()
    })

    it('given no pricing options, when details render, then the pricing section is hidden', () => {
      render(<EventDetails event={{ ...baseEvent, pricingOptions: [] }} />)
      expect(screen.queryByText(/EUR/)).not.toBeInTheDocument()
      expect(screen.queryByText('Free')).not.toBeInTheDocument()
    })
  })
})
