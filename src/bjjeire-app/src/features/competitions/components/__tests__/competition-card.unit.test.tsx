import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CompetitionCard } from '../competition-card/competition-card'
import {
  CompetitionsPageTestIds,
  CompetitionCardTestIds,
} from '@/constants/competitionDataTestIds'
import { createCompetition } from '@/testing/factories/competition.factory'

const FULL_COMPETITION = createCompetition({
  id: 'test-1',
  name: 'Dublin International Open IBJJF',
  organisation: 'IBJJF',
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
  organisation: 'NAGA',
  websiteUrl: 'https://nagafighter.com',
  tags: [],
})

const NO_WEBSITE_COMPETITION = createCompetition({
  id: 'test-3',
  name: 'Unknown Open',
  organisation: 'Other',
  websiteUrl: '',
})

describe('CompetitionCard', () => {
  it('given a competition with full details, when the card renders, then name, dates, description, tags and both links are shown', () => {
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

  it('given a competition with minimal details, when the card renders, then description, tags and register link are hidden', () => {
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

  it('given a competition without dates, when the card renders, then the date row is hidden', () => {
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

  it('given a competition starting and ending on the same day, when the card renders, then a single date is shown', () => {
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

  it('given a competition without a website, when the card renders, then the website button is disabled', () => {
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
