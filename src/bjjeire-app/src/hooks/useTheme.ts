import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'bjjeire-theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') {return stored}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = (): void => setTheme((t: Theme): Theme => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
