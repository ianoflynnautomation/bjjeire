import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CompetitionCard } from '../components/competition-card/competition-card'
import {
  CompetitionsPageTestIds,
  CompetitionCardTestIds,
} from '@/constants/competitionDataTestIds'
import { CompetitionOrganisation } from '@/types/competitions'
import { createCompetition } from '@/testing/factories/competition.factory'

const FULL_COMPETITION = createCompetition({
  id: 'test-1',
  name: 'Dublin International Open IBJJF',
  organisation: CompetitionOrganisation.IBJJF,
  description: 'Premier IBJJF tournament in Dublin.',
  websiteUrl: 'https://ibjjf.com/dublin',
  registrationUrl: 'https://ibjjf.com/dublin/register',
  tags: ['ibjjf', 'gi', 'open'],
  startDate: '2026-05-16T00:00:00Z',
  endDate: '2026-05-17T00:00:00Z',
})

const MINIMAL_COMPETITION = createCompetition({
  id: 'test-2',
  name: 'NAGA Ireland',
  organisation: CompetitionOrganisation.NAGA,
  websiteUrl: 'https://nagafighter.com',
  tags: [],
})

const NO_WEBSITE_COMPETITION = createCompetition({
  id: 'test-3',
  name: 'Unknown Open',
  organisation: CompetitionOrganisation.Other,
  websiteUrl: '',
})

describe('CompetitionCard', () => {
  describe('full data', () => {
    it('renders name, organisation badge, description, tags, and both buttons', () => {
      render(
        <CompetitionCard
          competition={FULL_COMPETITION}
          data-testid={CompetitionsPageTestIds.LIST_ITEM}
        />
      )

      const card = screen.getByTestId(CompetitionsPageTestIds.LIST_ITEM)

      expect(
        within(card).getByTestId(CompetitionCardTestIds.NAME)
      ).toHaveTextContent('Dublin International Open IBJJF')
      expect(
        within(card).getByTestId(CompetitionCardTestIds.ORGANISATION)
      ).toHaveTextContent('IBJJF')
      expect(
        within(card).getByTestId(CompetitionCardTestIds.DATE)
      ).toHaveTextContent('16–17 May 2026')
      expect(
        within(card).getByTestId(CompetitionCardTestIds.DESCRIPTION)
      ).toHaveTextContent('Premier IBJJF tournament in Dublin.')

      const tagItems = within(card).getAllByTestId(
        CompetitionCardTestIds.TAG_ITEM
      )
      expect(tagItems).toHaveLength(3)

      const websiteLink = within(card).getByTestId(
        CompetitionCardTestIds.WEBSITE_BUTTON
      )
      expect(websiteLink.tagName).toBe('A')
      expect(websiteLink).toHaveAttribute('href', 'https://ibjjf.com/dublin')

      const registerLink = within(card).getByTestId(
        CompetitionCardTestIds.REGISTER_BUTTON
      )
      expect(registerLink.tagName).toBe('A')
      expect(registerLink).toHaveAttribute(
        'href',
        'https://ibjjf.com/dublin/register'
      )
    })
  })

  describe('minimal data', () => {
    it('renders without description or tags, and hides register button when no registrationUrl', () => {
      render(
        <CompetitionCard
          competition={MINIMAL_COMPETITION}
          data-testid={CompetitionsPageTestIds.LIST_ITEM}
        />
      )

      const card = screen.getByTestId(CompetitionsPageTestIds.LIST_ITEM)

      expect(
        within(card).queryByTestId(CompetitionCardTestIds.DESCRIPTION)
      ).not.toBeInTheDocument()
      expect(
        within(card).queryByTestId(CompetitionCardTestIds.TAGS)
      ).not.toBeInTheDocument()
      expect(
        within(card).queryByTestId(CompetitionCardTestIds.REGISTER_BUTTON)
      ).not.toBeInTheDocument()
    })
  })

  describe('dates', () => {
    it('hides the date row when no startDate is provided', () => {
      render(
        <CompetitionCard
          competition={createCompetition({
            startDate: undefined,
            endDate: undefined,
          })}
          data-testid={CompetitionsPageTestIds.LIST_ITEM}
        />
      )
      expect(
        screen.queryByTestId(CompetitionCardTestIds.DATE)
      ).not.toBeInTheDocument()
    })

    it('shows a single date when start and end are the same day', () => {
      render(
        <CompetitionCard
          competition={createCompetition({
            startDate: '2026-06-06T00:00:00Z',
            endDate: '2026-06-06T00:00:00Z',
          })}
          data-testid={CompetitionsPageTestIds.LIST_ITEM}
        />
      )
      expect(screen.getByTestId(CompetitionCardTestIds.DATE)).toHaveTextContent(
        '6 June 2026'
      )
    })
  })

  describe('no website', () => {
    it('renders a disabled button when websiteUrl is empty', () => {
      render(
        <CompetitionCard
          competition={NO_WEBSITE_COMPETITION}
          data-testid={CompetitionsPageTestIds.LIST_ITEM}
        />
      )

      const card = screen.getByTestId(CompetitionsPageTestIds.LIST_ITEM)
      const websiteButton = within(card).getByTestId(
        CompetitionCardTestIds.WEBSITE_BUTTON
      )
      expect(websiteButton.tagName).toBe('BUTTON')
      expect(websiteButton).toBeDisabled()
    })
  })
})
