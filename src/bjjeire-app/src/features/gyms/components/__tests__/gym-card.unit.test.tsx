import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymCard } from './../gym-card/gym-card'
import { MOCK_GYM_FULL } from './mocks/gym.mock'

function renderCard(): HTMLElement {
  render(<GymCard gym={MOCK_GYM_FULL} />)
  return screen.getByRole('article', {
    name: new RegExp(MOCK_GYM_FULL.name, 'i'),
  })
}

describe('GymCard', () => {
  it('given a gym with full details, when the card renders, then header, address and website are composed', () => {
    const card = renderCard()
    const expectedAddress = `${MOCK_GYM_FULL.location.address} (${MOCK_GYM_FULL.location.venue})`

    expect(
      within(card).getByRole('heading', {
        name: new RegExp(MOCK_GYM_FULL.name, 'i'),
        level: 3,
      })
    ).toBeInTheDocument()
    expect(
      within(card).getByRole('link', {
        name: new RegExp(MOCK_GYM_FULL.location.address, 'i'),
      })
    ).toHaveTextContent(expectedAddress)
    expect(
      within(card).getByRole('link', {
        name: new RegExp(`visit website for ${MOCK_GYM_FULL.name}`, 'i'),
      })
    ).toHaveAttribute('href', MOCK_GYM_FULL.website)
  })
})
