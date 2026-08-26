import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { RoundRecord } from '../game/stats/types'
import { RoundDetailContext } from './RoundDetailContext'
import type { RoundDetailContextValue } from './RoundDetailContext'

// Same shape as HowToPlayProvider — lifted out so any number of triggers on
// the stats page (a round-history row, a "Best round" stat) can open the
// same single drawer instance with whichever round they represent, rather
// than each needing its own open/closed state.
export function RoundDetailProvider({ children }: { children: ReactNode }) {
  const [round, setRound] = useState<RoundRecord | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const open = useCallback((next: RoundRecord) => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    setRound(next)
  }, [])

  const close = useCallback(() => {
    setRound(null)
    previouslyFocusedRef.current?.focus()
  }, [])

  const value = useMemo<RoundDetailContextValue>(() => ({ round, open, close }), [round, open, close])

  return <RoundDetailContext.Provider value={value}>{children}</RoundDetailContext.Provider>
}
