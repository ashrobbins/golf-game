import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { HowToPlayContext } from './HowToPlayContext'
import type { HowToPlayContextValue } from './HowToPlayContext'
import { NavDrawerContext } from './NavDrawerContext'
import type { NavDrawerContextValue } from './NavDrawerContext'

type ActiveOverlay = 'help' | 'nav' | null

// Formerly HowToPlayProvider — broadened to coordinate the How to Play
// drawer and the mobile hamburger nav drawer from one shared `active`
// value, since the two must never both be open at once (there's only one
// slide-in panel slot in the layout, and having both try to occupy it at
// the same time would visually collide). Each consumer still gets its own
// narrow context (HowToPlayContext / NavDrawerContext) with the same
// {isOpen, open, close} shape as before, so nothing that already calls
// useHowToPlay() (HomePage's "How it works" button, HowToPlayTrigger,
// HowToPlayDrawer) needed to change — opening either one here always
// closes the other first, structurally, rather than each drawer having to
// remember to close its sibling.
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveOverlay>(null)

  // Whichever element had focus right before an overlay opened — restored
  // once everything's closed again, regardless of which overlay it was or
  // how it got closed.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const openHelp = useCallback(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    setActive('help')
  }, [])

  const openNav = useCallback(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    setActive('nav')
  }, [])

  const closeAll = useCallback(() => {
    setActive(null)
    previouslyFocusedRef.current?.focus()
  }, [])

  const howToPlayValue = useMemo<HowToPlayContextValue>(
    () => ({ isOpen: active === 'help', open: openHelp, close: closeAll }),
    [active, openHelp, closeAll],
  )

  const navDrawerValue = useMemo<NavDrawerContextValue>(
    () => ({ isOpen: active === 'nav', open: openNav, close: closeAll }),
    [active, openNav, closeAll],
  )

  return (
    <HowToPlayContext.Provider value={howToPlayValue}>
      <NavDrawerContext.Provider value={navDrawerValue}>{children}</NavDrawerContext.Provider>
    </HowToPlayContext.Provider>
  )
}
