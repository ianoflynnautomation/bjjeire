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
  it('defaults to light when no preference is stored and system is light', () => {
    stubStorage(null)
    setMatchMedia(false)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('defaults to dark when no preference is stored and system prefers dark', () => {
    stubStorage(null)
    setMatchMedia(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('restores light theme from localStorage', () => {
    stubStorage('light')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('restores dark theme from localStorage', () => {
    stubStorage('dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('ignores invalid values in localStorage and falls back to system preference', () => {
    stubStorage('blue')
    setMatchMedia(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('localStorage takes precedence over system preference', () => {
    stubStorage('light')
    setMatchMedia(true) // system says dark
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })
})

describe('useTheme — DOM side effects', () => {
  it('adds the dark class to <html> when theme is dark', () => {
    stubStorage('dark')
    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes the dark class from <html> when theme is light', () => {
    document.documentElement.classList.add('dark')
    stubStorage('light')
    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('sets colorScheme on <html> to dark', () => {
    stubStorage('dark')
    renderHook(() => useTheme())
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('sets colorScheme on <html> to light', () => {
    stubStorage('light')
    renderHook(() => useTheme())
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('persists theme to localStorage on mount', () => {
    stubStorage(null)
    setMatchMedia(true)
    renderHook(() => useTheme())
    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'dark')
  })
})

describe('useTheme — toggleTheme', () => {
  it('returns a toggleTheme function', () => {
    const { result } = renderHook(() => useTheme())
    expect(typeof result.current.toggleTheme).toBe('function')
  })

  it('toggles from light to dark', () => {
    stubStorage('light')
    const { result } = renderHook(() => useTheme())

    act(() => { result.current.toggleTheme() })

    expect(result.current.theme).toBe('dark')
  })

  it('toggles from dark to light', () => {
    stubStorage('dark')
    const { result } = renderHook(() => useTheme())

    act(() => { result.current.toggleTheme() })

    expect(result.current.theme).toBe('light')
  })

  it('adds dark class after toggling to dark', () => {
    stubStorage('light')
    const { result } = renderHook(() => useTheme())

    act(() => { result.current.toggleTheme() })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class after toggling to light', () => {
    stubStorage('dark')
    const { result } = renderHook(() => useTheme())

    act(() => { result.current.toggleTheme() })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists toggled theme to localStorage', () => {
    stubStorage('light')
    const { result } = renderHook(() => useTheme())

    act(() => { result.current.toggleTheme() })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'dark')
  })

  it('toggles back to original theme on second toggle', () => {
    stubStorage('light')
    const { result } = renderHook(() => useTheme())

    act(() => { result.current.toggleTheme() })
    act(() => { result.current.toggleTheme() })

    expect(result.current.theme).toBe('light')
  })
})
