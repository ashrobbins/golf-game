import { useCallback, useMemo, useReducer } from 'react'
import type { CountriesContent, Course, Golfer } from '../content/types'
import { autoCompleteDraft } from '../game/draft/autoPick'
import { createInitialDraftState } from '../game/draft/engine'
import { createDraftReducer } from '../game/draft/reducer'

function buildGolferIndex(countries: CountriesContent): Map<string, Golfer> {
  const index = new Map<string, Golfer>()
  for (const country of countries.countries) {
    for (const golfer of country.golfers) index.set(golfer.id, golfer)
  }
  return index
}

// autoPick jumps straight to the finished bag — the lazy useReducer
// initializer runs autoCompleteDraft once, synchronously, before the first
// render, so the component never renders an intermediate 'ready_to_spin' /
// 'spinning' / 'awaiting_pick' state at all (see DraftPage.tsx, which only
// ever shows the picker UI for those statuses).
export function useDraftGame(course: Course, countries: CountriesContent, autoPick: boolean) {
  const reducer = useMemo(() => createDraftReducer(Math.random), [])
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const initial = createInitialDraftState(course, countries)
    if (!autoPick) return initial
    return autoCompleteDraft(initial, course, buildGolferIndex(countries), Math.random)
  })

  const spin = useCallback(() => dispatch({ type: 'SPIN' }), [])
  const confirmSpin = useCallback(() => dispatch({ type: 'SPIN_RESOLVED' }), [])
  const pick = useCallback((golferId: string) => dispatch({ type: 'PICK_GOLFER', golferId }), [])

  return { state, spin, confirmSpin, pick }
}
