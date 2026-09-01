import { createContext } from 'react'

export interface HowToPlayContextValue {
  isOpen: boolean
  // True only when the currently-open drawer instance was reached via the
  // mobile hamburger menu (MobileNavDrawer's "How to play" row), not via a
  // direct trigger (the nav's own "?" icon, HomePage's "How it works"
  // button) — lets HowToPlayDrawer show a "← Menu" back link only then.
  openedFromNav: boolean
  open: () => void
  openFromNav: () => void
  close: () => void
  backToNav: () => void
}

export const HowToPlayContext = createContext<HowToPlayContextValue | null>(null)
