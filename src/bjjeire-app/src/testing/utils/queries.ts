import { screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'

export async function waitForLoaded(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
}

export async function expectNoError(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
}

export function getCombobox(name: RegExp | string): HTMLElement {
  return screen.getByRole('combobox', { name })
}

export function getButton(name: RegExp | string): HTMLElement {
  return screen.getByRole('button', { name })
}
