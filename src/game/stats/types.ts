import type { SimulationResult } from '../simulation/types'

export interface RoundRecord extends SimulationResult {
  id: string
  playedAt: string
}

export interface StatsStore {
  version: 1
  rounds: RoundRecord[]
}
