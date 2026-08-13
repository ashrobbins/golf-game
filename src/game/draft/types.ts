export interface DraftPick {
  holeNumber: number
  countryId: string
  golferId: string
}

export type DraftStatus = 'ready_to_spin' | 'spinning' | 'awaiting_pick' | 'complete'

export interface DraftState {
  courseId: string
  currentHole: number
  picks: DraftPick[]
  draftedGolferIds: Set<string>
  countryDraftCounts: Record<string, number>
  countryBenches: Record<string, string[]>
  wheelCountryIds: string[]
  pendingSpinCountryId?: string
  pendingGolferOptions?: string[]
  status: DraftStatus
}

export type DraftAction =
  | { type: 'SPIN' }
  | { type: 'SPIN_RESOLVED' }
  | { type: 'PICK_GOLFER'; golferId: string }

export const REPEAT_CAP = 3
export const MIN_BENCH_TO_STAY_ON_WHEEL = 3
export const GOLFERS_OFFERED_PER_SPIN = 3
export const TOTAL_HOLES = 18
