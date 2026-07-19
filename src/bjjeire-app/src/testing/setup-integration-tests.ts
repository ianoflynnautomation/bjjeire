import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './msw/server'
import { resetGymIdCounter } from './factories/gym.factory'
import { resetEventIdCounter } from './factories/event.factory'
import { resetCompetitionIdCounter } from './factories/competition.factory'
import './setup-tests'

vi.mock('@/config/env', () => ({
  env: { API_URL: 'http://localhost', PAGE_NUMBER: 1, PAGE_SIZE: 20 },
}))

vi.mock('@/lib/msal-config', () => ({
  msalInstance: {
    getAllAccounts: (): object[] => [],
    acquireTokenSilent: vi.fn(),
  },
  loginRequest: { scopes: [] },
}))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

afterEach(() => {
  server.resetHandlers()
  resetGymIdCounter()
  resetEventIdCounter()
  resetCompetitionIdCounter()
})
