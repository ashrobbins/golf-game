import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { SeasonLeaderboardContext } from './SeasonLeaderboardContext'
import type { SeasonLeaderboardContextValue } from './SeasonLeaderboardContext'

// Same shape as RoundDetailProvider — lifted out so both the Season Hub's
// hero card and the Seasons History accordion cards can open the same
// single drawer instance with whichever season they represent.
export function SeasonLeaderboardProvider({ children }: { children: ReactNode }) {
  const [seasonId, setSeasonId] = useState<string | null>(null)
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const open = useCallback((nextSeasonId: string, nextSeasonNumber: number) => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    setSeasonId(nextSeasonId)
    setSeasonNumber(nextSeasonNumber)
  }, [])

  const close = useCallback(() => {
    setSeasonId(null)
    setSeasonNumber(null)
    previouslyFocusedRef.current?.focus()
  }, [])

  const value = useMemo<SeasonLeaderboardContextValue>(
    () => ({ seasonId, seasonNumber, open, close }),
    [seasonId, seasonNumber, open, close],
  )

  return <SeasonLeaderboardContext.Provider value={value}>{children}</SeasonLeaderboardContext.Provider>
}
