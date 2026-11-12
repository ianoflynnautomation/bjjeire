import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createGym } from '@/testing/factories/gym.factory'
import { getGoogleMapsUrl } from '@/utils/map-utils'
import { GymMapPopup } from '../gym-map-popup'

describe('GymMapPopup (#1010)', () => {
  it('given a gym, when the popup renders, then name, county, address and matching links are shown', () => {
    const gym = createGym({
      name: 'Elite Fighters Academy',
      county: 'Cork',
      website: 'elite.example.com',
    })
    render(<GymMapPopup gym={gym} onClose={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'Elite Fighters Academy' })
    ).toBeInTheDocument()
    expect(screen.getByText('Cork County')).toBeInTheDocument()
    expect(screen.getByText(gym.location.address)).toBeInTheDocument()
    const website = screen.getByRole('link', { name: /visit website/i })
    expect(website).toHaveAttribute('href', 'https://elite.example.com')
    expect(website).toHaveAttribute('rel', 'noopener noreferrer')
    const directions = screen.getByRole('link', { name: /directions/i })
    expect(directions).toHaveAttribute('href', getGoogleMapsUrl(gym.location))
    expect(directions).toHaveAttribute('target', '_blank')
  })

  it.each([undefined, '', '   ', 'javascript:alert(1)'])(
    'given website %j, when the popup renders, then the website link is left out',
    website => {
      render(<GymMapPopup gym={createGym({ website })} onClose={vi.fn()} />)

      expect(
        screen.queryByRole('link', { name: /visit website/i })
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: /directions/i })
      ).toBeInTheDocument()
    }
  )

  it('given a name containing HTML, when the popup renders, then it is text and creates no elements', () => {
    const name = '<img src=x onerror="window.pwned=1"><b>Gym</b>'
    const { container } = render(
      <GymMapPopup gym={createGym({ name })} onClose={vi.fn()} />
    )

    expect(screen.getByRole('heading', { name })).toHaveTextContent(name)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
  })

  it('given an address containing HTML, when the popup renders, then it is text', () => {
    const address = '<script>window.pwned=1</script> Main St'
    const gym = createGym()
    gym.location = { ...gym.location, address }
    const { container } = render(<GymMapPopup gym={gym} onClose={vi.fn()} />)

    expect(screen.getByText(address)).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
  })

  it('given an open popup, when it mounts, then focus moves into it so the links are next by keyboard', async () => {
    const user = userEvent.setup()
    render(
      <GymMapPopup
        gym={createGym({ website: 'https://elite.example.com' })}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByRole('group')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: /visit website/i })).toHaveFocus()
  })

  it('given focus has moved out of the popup, when Escape is pressed, then it still asks to close', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Elsewhere</button>
        <GymMapPopup gym={createGym()} onClose={onClose} />
      </>
    )

    screen.getByRole('button', { name: 'Elsewhere' }).focus()
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('given an open popup, when Escape or close is used, then it asks to close', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<GymMapPopup gym={createGym()} onClose={onClose} />)

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: /close gym details/i }))

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
