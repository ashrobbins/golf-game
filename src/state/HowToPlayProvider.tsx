import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { HowToPlayContext } from './HowToPlayContext'
import type { HowToPlayContextValue } from './HowToPlayContext'

// Lifted out of the drawer component itself so more than one trigger (the
// nav's "?" icon, the home page's "How it works" button) can open the same
// single drawer instance instead of each needing its own.
export function HowToPlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  // Whichever element had focus right before opening — could be either
  // trigger, or anything else in the future. Restored on close so focus
  // doesn't just vanish, regardless of which one was actually used.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const open = useCallback(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    previouslyFocusedRef.current?.focus()
  }, [])

  const value = useMemo<HowToPlayContextValue>(() => ({ isOpen, open, close }), [isOpen, open, close])

  return <HowToPlayContext.Provider value={value}>{children}</HowToPlayContext.Provider>
}
