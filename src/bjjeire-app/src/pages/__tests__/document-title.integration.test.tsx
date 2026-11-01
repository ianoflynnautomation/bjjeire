import { waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AboutPage from '@/pages/AboutPage'
import { renderWithProviders } from '@/testing/render-utils'
import {
  renderEventsPage,
  seedEvents,
} from '@/features/bjjevents/testing/bjj-events-test-helpers'
import {
  renderCompetitionsPage,
  seedCompetitions,
} from '@/features/competitions/testing/competitions-test-helpers'
import {
  renderGymsPage,
  seedGyms,
} from '@/features/gyms/testing/gyms-test-helpers'
import {
  renderStoresPage,
  seedStores,
} from '@/features/stores/testing/stores-test-helpers'

const PAGES: [string, () => void, string][] = [
  [
    'Events',
    (): void => {
      seedEvents([])
      renderEventsPage()
    },
    'BJJ Events in Ireland | BJJ Éire',
  ],
  [
    'Gyms',
    (): void => {
      seedGyms([])
      renderGymsPage()
    },
    'BJJ Gyms in Ireland | BJJ Éire',
  ],
  [
    'Competitions',
    (): void => {
      seedCompetitions([])
      renderCompetitionsPage()
    },
    'BJJ Competitions | BJJ Éire',
  ],
  [
    'Stores',
    (): void => {
      seedStores([])
      renderStoresPage()
    },
    'BJJ Clothing Stores | BJJ Éire',
  ],
  [
    'About',
    (): void => {
      renderWithProviders(<AboutPage />)
    },
    'About | BJJ Éire',
  ],
]

describe('Document title', () => {
  it.each(PAGES)(
    'given the %s page, when it opens, then the tab title names the page',
    async (_name, renderPage, title) => {
      renderPage()

      await waitFor(() => {
        expect(document.title).toBe(title)
      })
    }
  )
})
