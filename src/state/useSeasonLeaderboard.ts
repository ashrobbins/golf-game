import { useContext } from 'react'
import { SeasonLeaderboardContext } from './SeasonLeaderboardContext'
import type { SeasonLeaderboardContextValue } from './SeasonLeaderboardContext'

export function useSeasonLeaderboard(): SeasonLeaderboardContextValue {
  const ctx = useContext(SeasonLeaderboardContext)
  if (!ctx) throw new Error('useSeasonLeaderboard must be used within a SeasonLeaderboardProvider')
  return ctx
}
