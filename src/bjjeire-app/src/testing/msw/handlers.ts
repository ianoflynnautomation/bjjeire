import { http, HttpResponse } from 'msw'
import { createPaginatedGyms, createGym } from '../factories/gym.factory'
import { createPaginatedEvents, createEvent } from '../factories/event.factory'
import type { FeatureFlagsMap } from '@/features/feature-flags'

const defaultFlags: FeatureFlagsMap = { BjjEvents: true, Gyms: true }

export const handlers = [
  http.get('*/api/featureflag', () => HttpResponse.json(defaultFlags)),

  http.get('*/api/gym', () =>
    HttpResponse.json(createPaginatedGyms([createGym()], 1, 1))
  ),

  http.get('*/api/bjjevent', () =>
    HttpResponse.json(createPaginatedEvents([createEvent()], 1, 1))
  ),
]
