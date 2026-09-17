import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Theme = 'dark' | 'light' | 'system'

const KEY = 'kobbleston.theme'

const ThemeContext = createContext<{
  theme: Theme
  resolved: 'dark' | 'light'
  setTheme: (next: Theme) => void
}>({
  theme: 'dark',
  resolved: 'dark',
  setTheme: () => {},
})

const stored = (): Theme => {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    // private windows and blocked storage both land here; the default is fine
  }
  return 'dark'
}

const prefersLight = () =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-color-scheme: light)').matches

/**
 * Dark or light, kept on this device. It is a look, not an account setting,
 * so it lives in the browser rather than on the profile.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(stored)
  const [systemLight, setSystemLight] = useState(prefersLight)

  // On System, the machine decides, and it is allowed to change its mind
  // while the page is open.
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!query) return
    const listen = (e: MediaQueryListEvent) => setSystemLight(e.matches)
    query.addEventListener('change', listen)
    return () => query.removeEventListener('change', listen)
  }, [])

  const resolved: 'dark' | 'light' =
    theme === 'system' ? (systemLight ? 'light' : 'dark') : theme

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
  }, [resolved])

  const value = useMemo(() => ({
    theme,
    resolved,
    setTheme: (next: Theme) => {
      setThemeState(next)
      try { localStorage.setItem(KEY, next) } catch { /* nothing to do */ }
    },
  }), [theme, resolved])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

/**
 * Some pages are written for one look and one look only: the way in, and the
 * pages that say what this place is. They hold dark while they are open and
 * hand the theme back on the way out, without touching what the person chose.
 */
export function useForceDark() {
  useEffect(() => {
    const root = document.documentElement
    const previous = root.dataset.theme
    root.dataset.theme = 'dark'
    return () => { root.dataset.theme = previous ?? 'dark' }
  }, [])
}
