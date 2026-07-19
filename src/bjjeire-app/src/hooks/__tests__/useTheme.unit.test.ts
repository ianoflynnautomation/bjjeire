import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTheme } from '../useTheme'

const STORAGE_KEY = 'bjjeire-theme'

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

vi.stubGlobal('localStorage', localStorageMock)

function stubStorage(storedValue: string | null): void {
  localStorageMock.getItem.mockReturnValue(storedValue)
}

function setMatchMedia(prefersDark: boolean): void {
  vi.mocked(globalThis.matchMedia).mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockReturnValue(null)
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
  setMatchMedia(false)
})

describe('useTheme — initial theme', () => {
  it('given no stored preference and a light system, when the hook mounts, then the theme is light', () => {
    stubStorage(null)
    setMatchMedia(false)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('given no stored preference and a dark system, when the hook mounts, then the theme is dark', () => {
    stubStorage(null)
    setMatchMedia(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('given a stored light preference, when the hook mounts, then the theme is light', () => {
    stubStorage('light')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('given a stored dark preference, when the hook mounts, then the theme is dark', () => {
    stubStorage('dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('given an invalid stored value, when the hook mounts, then the system preference is used', () => {
    stubStorage('blue')
    setMatchMedia(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('given a stored preference that differs from the system, when the hook mounts, then the stored preference wins', () => {
    stubStorage('light')
    setMatchMedia(true) // system says dark
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })
})

describe('useTheme — DOM side effects', () => {
  it('given a dark theme, when the hook mounts, then the dark class is added to <html>', () => {
    stubStorage('dark')
    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('given a light theme, when the hook mounts, then the dark class is removed from <html>', () => {
    document.documentElement.classList.add('dark')
    stubStorage('light')
    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('given a dark theme, when the hook mounts, then colorScheme on <html> is dark', () => {
    stubStorage('dark')
    renderHook(() => useTheme())
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('given a light theme, when the hook mounts, then colorScheme on <html> is light', () => {
    stubStorage('light')
    renderHook(() => useTheme())
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('given a resolved theme, when the hook mounts, then the theme is persisted to localStorage', () => {
    stubStorage(null)
    setMatchMedia(true)
    renderHook(() => useTheme())
    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'dark')
  })
})

describe('useTheme — toggleTheme', () => {
  it('given a light theme, when the user toggles, then the theme becomes dark', () => {
    stubStorage('light')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
  })

  it('given a dark theme, when the user toggles, then the theme becomes light', () => {
    stubStorage('dark')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('light')
  })

  it('given a light theme, when the user toggles, then the dark class is added to <html>', () => {
    stubStorage('light')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('given a dark theme, when the user toggles, then the dark class is removed from <html>', () => {
    stubStorage('dark')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('given a light theme, when the user toggles, then the new theme is persisted to localStorage', () => {
    stubStorage('light')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'dark')
  })

  it('given a toggled theme, when the user toggles again, then the original theme is restored', () => {
    stubStorage('light')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })
    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('light')
  })
})
