import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})
window.IntersectionObserver = mockIntersectionObserver

vi.mock('../utils/dateUtils', async () => ({
  formatTime: vi.fn((time: string) => `MockFormattedTime(${time})`),
  formatDate: vi.fn((dateString: string) => `MockFormattedDate(${dateString})`),
}))

vi.mock('../utils/errorUtils', async () => ({
  formatFetchError: vi.fn(
    (error: unknown) =>
      `MockFormattedError: ${error instanceof Error ? error.message : String(error)}`
  ),
}))

vi.mock('../utils/eventUtils', async () => ({
  getEventTypeLabel: vi.fn((eventType: string) => `MockLabel(${eventType})`),
  getEventTypeColorClasses: vi.fn(
    (eventType: string) => `mock-event-colorscheme-${eventType}`
  ),
}))

vi.mock('../utils/formattingUtils', async () => ({
  formatDisplayUrl: vi.fn((url?: string) =>
    url ? `MockDisplayUrl(${url})` : undefined
  ),
  ensureExternalUrlScheme: vi.fn((url?: string) =>
    url ? `mock-schemed-${url}` : undefined
  ),
}))

vi.mock('../utils/gymDisplayUtils', async () => ({
  getGymStatusLabel: vi.fn((status: string) => `MockStatusLabel(${status})`),
  getGymStatusColorScheme: vi.fn(
    (status: string) => `mock-gym-colorscheme-${status}`
  ),
  getClassCategoryLabel: vi.fn(
    (category: string) => `MockClassLabel(${category})`
  ),
}))

vi.mock('../utils/mapUtils', async () => ({
  getGoogleMapsUrl: vi.fn((location?: any) =>
    location
      ? `mock-gmaps-url-for-${location.address || 'unknown'}`
      : '#mock-no-location-url'
  ),
}))

vi.mock('../utils/priceCalculator', async () => ({
  calculateEventPrice: vi.fn((pricing?: any) => ({
    total: pricing?.amount || 0,
    unit: 'mock-unit',
    currency: pricing?.currency || 'MCK',
  })),
}))

vi.mock('../hooks/useScrollToTop', async () => ({
  useScrollToTop: vi.fn(() =>
    vi.fn(() => console.log('MockScrollToTopCalled'))
  ),
}))

// Note on commonDataTestIds and withTestIdSuffix:
// If `withTestIdSuffix` is a simple utility like `(base, suffix) => \`${base}-${suffix}\``
// or `(baseFunc, suffix) => \`${baseFunc('')}-${suffix}\``, it generally doesn't need to be mocked
// as its behavior is straightforward. If it involves more complex logic or external
// dependencies (unlikely for such a utility), then mocking might be considered.
// For now, assuming it's simple and doesn't require mocking.

// vi.mock('../constants/commonDataTestIds', () => ({ // Adjust path if needed
//   withTestIdSuffix: vi.fn((baseFnOrString, suffix) => {
//     let base = '';
//     if (typeof baseFnOrString === 'function') {
//       base = baseFnOrString(''); // Assuming TestId functions can be called with empty string for base
//     } else {
//       base = baseFnOrString;
//     }
//     return suffix ? `${base}-${suffix}` : base;
//   }),
// }));
