import { Suspense } from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AppRoutes } from '@/App'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { renderWithProviders } from '@/testing/render-utils'

function renderAppRoutes(initialRoute: string): void {
  renderWithProviders(
    <Suspense fallback={null}>
      <AppRoutes />
    </Suspense>,
    { initialRoutes: [initialRoute] }
  )
}

describe('AppRoutes', () => {
  it('given the Gyms flag is off, when a visitor opens /gyms, then they are redirected to About', async () => {
    renderAppRoutes(paths.gyms.path)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: uiContent.about.title,
      })
    ).toBeInTheDocument()
  })
})
