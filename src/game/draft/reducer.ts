import type { Rng } from '../rng'
import { applyPick, drawGolfers, spinWheel } from './engine'
import type { DraftAction, DraftState } from './types'

export function createDraftReducer(rng: Rng = Math.random) {
  return function draftReducer(state: DraftState, action: DraftAction): DraftState {
    switch (action.type) {
      case 'SPIN':
        return spinWheel(state, rng)
      case 'SPIN_RESOLVED':
        return drawGolfers(state, rng)
      case 'PICK_GOLFER':
        return applyPick(state, action.golferId)
      default:
        return state
    }
  }
}
