import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Theme = 'dark' | 'light'

const KEY = 'kobbleston.theme'

const ThemeContext = createContext<{ theme: Theme; setTheme: (next: Theme) => void }>({
  theme: 'dark',
  setTheme: () => {},
})

const stored = (): Theme => {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // private windows and blocked storage both land here; the default is fine
  }
  return 'dark'
}

/**
 * Dark or light, kept on this device. It is a look, not an account setting,
 * so it lives in the browser rather than on the profile.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(stored)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const value = useMemo(() => ({
    theme,
    setTheme: (next: Theme) => {
      setThemeState(next)
      try { localStorage.setItem(KEY, next) } catch { /* nothing to do */ }
    },
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
