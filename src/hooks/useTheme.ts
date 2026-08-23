import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : null
}

// Until the user actually toggles, `theme` stays `null` and no `data-theme`
// attribute is ever set — the page keeps following the OS's live
// `prefers-color-scheme` via the CSS media query in index.css, exactly as
// it did before this hook existed. Only a real toggle click switches to an
// explicit, persisted override.
export function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(getStoredTheme)

  useEffect(() => {
    if (!theme) return
    document.documentElement.dataset.theme = theme
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) => ((current ?? getSystemTheme()) === 'dark' ? 'light' : 'dark'))
  }

  return { theme: theme ?? getSystemTheme(), toggleTheme }
}
