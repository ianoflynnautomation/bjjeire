import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'competition'

const STORAGE_KEY = 'bjjeire-theme'
const CYCLE: readonly Theme[] = ['light', 'dark', 'competition']

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark' || stored === 'competition') {
    return stored
  }
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function useTheme(): { theme: Theme; cycleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark' || theme === 'competition')
    root.classList.toggle('competition', theme === 'competition')
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const cycleTheme = useCallback(
    (): void =>
      setTheme((t): Theme => CYCLE[(CYCLE.indexOf(t) + 1) % CYCLE.length]),
    []
  )

  return { theme, cycleTheme }
}
