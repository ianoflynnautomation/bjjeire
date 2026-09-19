import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import SupportModal from '../support-modal'
import { uiContent } from '@/config/ui-content'
import { API_ROUTES } from '@/config/api-routes'
import { SupportModalTestIds } from '@/constants/commonDataTestIds'

describe('SupportModal', () => {
  it('given the modal is closed, when it renders, then nothing is shown', () => {
    const { container } = render(
      <SupportModal isOpen={false} onClose={vi.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('given the modal is open, when it renders, then the title, description, QR code and warning are shown', () => {
    render(<SupportModal isOpen onClose={vi.fn()} />)

    expect(
      screen.getByRole('dialog', { name: uiContent.supportModal.title })
    ).toBeInTheDocument()
    expect(
      screen.getByText(uiContent.supportModal.description)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: uiContent.supportModal.qrCodeAlt })
    ).toHaveAttribute('src', API_ROUTES.donateBitcoinQr)
    expect(screen.getByText(uiContent.supportModal.warning)).toBeInTheDocument()
  })

  it('given an open modal, when the close button is clicked, then onClose is called', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SupportModal isOpen onClose={onClose} />)

    await user.click(
      screen.getByRole('button', { name: uiContent.supportModal.closeLabel })
    )

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('given an open modal, when the overlay is clicked, then onClose is called', () => {
    const onClose = vi.fn()
    render(<SupportModal isOpen onClose={onClose} />)

    fireEvent.mouseDown(screen.getByTestId(SupportModalTestIds.OVERLAY))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('given an open modal, when the dialog is clicked, then onClose is not called', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SupportModal isOpen onClose={onClose} />)

    await user.click(screen.getByRole('dialog'))

    expect(onClose).not.toHaveBeenCalled()
  })
})
