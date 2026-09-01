import { useEffect, useState } from 'react'

const STORAGE_KEY = 'draft-animation-enabled'

function systemPrefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Same private-browsing/storage-disabled guard as useTheme.ts — this
// initializer runs synchronously on every render of Reel.tsx (every hole's
// spin), so a throw here would break the draft screen, not just settings.
function getStoredPreference(): boolean | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') return true
    if (stored === 'false') return false
    return null
  } catch {
    return null
  }
}

// Until the user explicitly flips the Settings toggle, `enabled` stays
// `null` and the OS's live `prefers-reduced-motion` decides the default —
// same "null until an explicit choice" shape as useTheme.ts, so a player
// who already has reduced motion set at the OS level gets instant drafts
// for free, with no settings visit required.
export function useDraftAnimation() {
  const [stored, setStored] = useState<boolean | null>(getStoredPreference)

  useEffect(() => {
    if (stored === null) return
    try {
      localStorage.setItem(STORAGE_KEY, String(stored))
    } catch {
      // Storage disabled/unavailable — the toggle still works for this page
      // load via React state, it just won't persist across a reload.
    }
  }, [stored])

  return {
    enabled: stored ?? !systemPrefersReducedMotion(),
    setEnabled: setStored,
  }
}
