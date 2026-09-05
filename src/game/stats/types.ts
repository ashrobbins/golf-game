import type { SimulationResult } from '../simulation/types'

export interface RoundRecord extends SimulationResult {
  id: string
  playedAt: string
  // Present only when this round was played as part of a season (see
  // game/season/) — untagged for every Free Play round. All three are set
  // together or not at all.
  seasonId?: string
  seasonRoundNumber?: number
  isMajor?: boolean
}

export interface StatsStore {
  version: 1
  rounds: RoundRecord[]
}
