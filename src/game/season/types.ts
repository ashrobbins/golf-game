export interface SeasonScheduleEntry {
  roundNumber: number
  courseId: string
  isMajor: boolean
}

export interface SeasonRoundResult {
  roundNumber: number
  courseId: string
  isMajor: boolean
  isBogeyFreeRound: boolean
  totalStrokesToPar: number
  roundRecordId: string
}

export interface ActiveSeason {
  id: string
  seasonNumber: number
  startedAt: string
  schedule: SeasonScheduleEntry[]
  results: SeasonRoundResult[]
}

export interface CompletedSeason extends ActiveSeason {
  completedAt: string
}

export interface SeasonsStore {
  version: 1
  seasons: CompletedSeason[]
}
