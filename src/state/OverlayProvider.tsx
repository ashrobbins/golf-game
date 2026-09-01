import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { HowToPlayContext } from './HowToPlayContext'
import type { HowToPlayContextValue } from './HowToPlayContext'
import { NavDrawerContext } from './NavDrawerContext'
import type { NavDrawerContextValue } from './NavDrawerContext'
import { SettingsContext } from './SettingsContext'
import type { SettingsContextValue } from './SettingsContext'

type ActiveOverlay =
  | { kind: 'help'; from: 'direct' | 'nav' }
  | { kind: 'settings'; from: 'direct' | 'nav' }
  | { kind: 'nav' }
  | null

// Coordinates the How to Play drawer, the Settings drawer, and the mobile
// hamburger nav drawer from one shared `active` value, since only one
// slide-in panel slot exists in the layout and any two of these open at
// once would visually collide. Each consumer still gets its own narrow
// context (HowToPlayContext / SettingsContext / NavDrawerContext).
//
// Help and Settings can each be reached two ways: directly (the nav's own
// icon, or — for Help — HomePage's "How it works" button) or via the
// mobile nav drawer's menu rows. The `from` field on the active-overlay
// state remembers which, so the drawer can show a "← Menu" back link only
// when it makes sense to go back to a menu that was actually open a moment
// ago — a direct open has no "back" to offer, just close.
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveOverlay>(null)

  // Whichever element had focus right before an overlay opened — restored
  // once everything's closed again, regardless of which overlay it was or
  // how it got closed.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  function saveFocus() {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
  }

  const openHelp = useCallback(() => {
    saveFocus()
    setActive({ kind: 'help', from: 'direct' })
  }, [])

  const openHelpFromNav = useCallback(() => {
    setActive({ kind: 'help', from: 'nav' })
  }, [])

  const openSettings = useCallback(() => {
    saveFocus()
    setActive({ kind: 'settings', from: 'direct' })
  }, [])

  const openSettingsFromNav = useCallback(() => {
    setActive({ kind: 'settings', from: 'nav' })
  }, [])

  const openNav = useCallback(() => {
    saveFocus()
    setActive({ kind: 'nav' })
  }, [])

  // A lateral swap back to the menu, not a fresh open — no focus save
  // needed since we're still within the same overall "menu opened" flow.
  const backToNav = useCallback(() => {
    setActive({ kind: 'nav' })
  }, [])

  const closeAll = useCallback(() => {
    setActive(null)
    previouslyFocusedRef.current?.focus()
  }, [])

  const howToPlayValue = useMemo<HowToPlayContextValue>(
    () => ({
      isOpen: active?.kind === 'help',
      openedFromNav: active?.kind === 'help' && active.from === 'nav',
      open: openHelp,
      openFromNav: openHelpFromNav,
      close: closeAll,
      backToNav,
    }),
    [active, openHelp, openHelpFromNav, closeAll, backToNav],
  )

  const settingsValue = useMemo<SettingsContextValue>(
    () => ({
      isOpen: active?.kind === 'settings',
      openedFromNav: active?.kind === 'settings' && active.from === 'nav',
      open: openSettings,
      openFromNav: openSettingsFromNav,
      close: closeAll,
      backToNav,
    }),
    [active, openSettings, openSettingsFromNav, closeAll, backToNav],
  )

  const navDrawerValue = useMemo<NavDrawerContextValue>(
    () => ({ isOpen: active?.kind === 'nav', open: openNav, close: closeAll }),
    [active, openNav, closeAll],
  )

  return (
    <HowToPlayContext.Provider value={howToPlayValue}>
      <SettingsContext.Provider value={settingsValue}>
        <NavDrawerContext.Provider value={navDrawerValue}>{children}</NavDrawerContext.Provider>
      </SettingsContext.Provider>
    </HowToPlayContext.Provider>
  )
}
