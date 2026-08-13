import type { OutcomeTier } from '../../content/types'

export interface HoleResult {
  holeNumber: number
  golferId: string
  countryId: string
  outcomeTier: OutcomeTier
  archetypeMatched: boolean
  relativeScore: number
}

export interface SimulationResult {
  courseId: string
  holeResults: HoleResult[]
  totalStrokesToPar: number
  bogeyFreeThroughHole: number
  isBogeyFreeRound: boolean
}
