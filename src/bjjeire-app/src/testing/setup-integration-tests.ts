import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './msw/server'
import { resetGymIdCounter } from './factories/gym.factory'
import { resetEventIdCounter } from './factories/event.factory'
import { resetCompetitionIdCounter } from './factories/competition.factory'
import { resetBjjEireCompetitionIdCounter } from './factories/bjjeire-competition.factory'
import { resetResultIdCounter } from './factories/result.factory'
import { resetRegistrationIdCounter } from './factories/registration.factory'
import { resetProductIdCounter } from './factories/product.factory'
import './setup-tests'

vi.mock('@/config/env', () => ({
  env: { API_URL: 'http://localhost', PAGE_NUMBER: 1, PAGE_SIZE: 20 },
}))

vi.mock('@/lib/msal-config', () => ({
  msalInstance: {
    initialize: (): Promise<void> => Promise.resolve(),
    getAllAccounts: (): object[] => [],
    acquireTokenSilent: vi.fn(),
  },
  loginRequest: { scopes: [] },
}))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

afterEach(() => {
  server.resetHandlers()
  resetGymIdCounter()
  resetEventIdCounter()
  resetCompetitionIdCounter()
  resetBjjEireCompetitionIdCounter()
  resetProductIdCounter()
  resetResultIdCounter()
  resetRegistrationIdCounter()
})
