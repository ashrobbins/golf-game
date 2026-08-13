import { useCallback, useMemo, useReducer } from 'react'
import type { CountriesContent, Course } from '../content/types'
import { createInitialDraftState } from '../game/draft/engine'
import { createDraftReducer } from '../game/draft/reducer'

export function useDraftGame(course: Course, countries: CountriesContent) {
  const reducer = useMemo(() => createDraftReducer(Math.random), [])
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialDraftState(course, countries),
  )

  const spin = useCallback(() => dispatch({ type: 'SPIN' }), [])
  const confirmSpin = useCallback(() => dispatch({ type: 'SPIN_RESOLVED' }), [])
  const pick = useCallback((golferId: string) => dispatch({ type: 'PICK_GOLFER', golferId }), [])

  return { state, spin, confirmSpin, pick }
}
