import { afterEach, vi } from 'vitest'
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

afterEach(() => {
  resetGymIdCounter()
  resetEventIdCounter()
  resetCompetitionIdCounter()
})
