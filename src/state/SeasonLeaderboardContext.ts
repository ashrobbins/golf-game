import { createContext } from 'react'

export interface SeasonLeaderboardContextValue {
  seasonId: string | null
  seasonNumber: number | null
  open: (seasonId: string, seasonNumber: number) => void
  close: () => void
}

export const SeasonLeaderboardContext = createContext<SeasonLeaderboardContextValue | null>(null)
