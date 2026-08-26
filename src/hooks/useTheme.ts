import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Private-browsing / storage-disabled environments can throw on almost any
// localStorage access, not just writes (see game/stats/storage.ts, which
// guards the same way) — swallow and fall back to "no stored preference"
// rather than letting it crash the render, since this initializer runs
// synchronously on every page via NavBar's ThemeToggle and there's no error
// boundary to catch it.
function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
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
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Storage disabled/unavailable — the toggle still works for this
      // page load via React state, it just won't persist across a reload.
    }
  }, [theme])

  function toggleTheme() {
    setTheme((current) => ((current ?? getSystemTheme()) === 'dark' ? 'light' : 'dark'))
  }

  return { theme: theme ?? getSystemTheme(), toggleTheme }
}
