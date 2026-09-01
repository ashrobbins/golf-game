import { createContext } from 'react'

export interface SettingsContextValue {
  isOpen: boolean
  // True only when the currently-open drawer instance was reached via the
  // mobile hamburger menu (MobileNavDrawer's "Settings" row), not via the
  // nav's own direct cog icon — lets SettingsDrawer show a "← Menu" back
  // link only then.
  openedFromNav: boolean
  open: () => void
  openFromNav: () => void
  close: () => void
  backToNav: () => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
