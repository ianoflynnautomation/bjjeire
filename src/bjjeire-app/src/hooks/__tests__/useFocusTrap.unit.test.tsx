import type { JSX } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface HarnessProps {
  isActive: boolean
  onClose: () => void
}

function TrapHarness({ isActive, onClose }: HarnessProps): JSX.Element {
  const dialogRef = useFocusTrap(isActive, onClose)

  return (
    <div>
      <button data-testid="outside">Outside</button>
      {isActive && (
        <div ref={dialogRef} data-testid="dialog">
          <button data-testid="first">First</button>
          <button data-testid="last">Last</button>
        </div>
      )}
    </div>
  )
}

describe('useFocusTrap', () => {
  it('given an active trap, when Escape is pressed, then the close handler fires', () => {
    const onClose = vi.fn()
    render(<TrapHarness isActive onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('given an inactive trap, when Escape is pressed, then nothing happens', () => {
    const onClose = vi.fn()
    render(<TrapHarness isActive={false} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('given an active trap, when it unmounts, then body scroll is locked while active and restored after', () => {
    const { unmount } = render(<TrapHarness isActive onClose={vi.fn()} />)

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('')
  })

  it('given focus on the last element, when Tab is pressed, then focus wraps to the first element', () => {
    render(<TrapHarness isActive onClose={vi.fn()} />)

    screen.getByTestId('last').focus()
    fireEvent.keyDown(document, { key: 'Tab' })

    expect(screen.getByTestId('first')).toHaveFocus()
  })

  it('given focus on the first element, when Shift+Tab is pressed, then focus wraps to the last element', () => {
    render(<TrapHarness isActive onClose={vi.fn()} />)

    screen.getByTestId('first').focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })

    expect(screen.getByTestId('last')).toHaveFocus()
  })

  it('given a trap that was activated, when it deactivates, then focus returns to the previously focused element', () => {
    const { rerender } = render(
      <TrapHarness isActive={false} onClose={vi.fn()} />
    )

    screen.getByTestId('outside').focus()
    rerender(<TrapHarness isActive onClose={vi.fn()} />)
    rerender(<TrapHarness isActive={false} onClose={vi.fn()} />)

    expect(screen.getByTestId('outside')).toHaveFocus()
  })
})
