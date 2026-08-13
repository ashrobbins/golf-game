import type { CountriesContent, Course } from '../../content/types'
import type { Rng } from '../rng'
import { randomIndex } from '../rng'
import {
  GOLFERS_OFFERED_PER_SPIN,
  MIN_BENCH_TO_STAY_ON_WHEEL,
  REPEAT_CAP,
  TOTAL_HOLES,
} from './types'
import type { DraftState } from './types'

// Dev-time safeguard: with a 3-pick-per-country cap, the draft can only ever
// complete if total capacity across all countries is at least TOTAL_HOLES.
// A too-thin content set should fail loudly at load time, not stall mid-draft.
export function assertWheelHasCapacity(content: CountriesContent): void {
  const capacity = content.countries.reduce(
    (sum, country) => sum + Math.min(REPEAT_CAP, country.golfers.length),
    0,
  )
  if (capacity < TOTAL_HOLES) {
    throw new Error(
      `Country content cannot fill an ${TOTAL_HOLES}-hole draft: total capacity is ${capacity}. ` +
        `Add more countries or deepen benches.`,
    )
  }
}

export function createInitialDraftState(
  course: Course,
  content: CountriesContent,
): DraftState {
  const countryBenches: Record<string, string[]> = {}
  const countryDraftCounts: Record<string, number> = {}

  for (const country of content.countries) {
    countryBenches[country.id] = country.golfers.map((g) => g.id)
    countryDraftCounts[country.id] = 0
  }

  const wheelCountryIds = content.countries
    .filter((country) => country.golfers.length >= MIN_BENCH_TO_STAY_ON_WHEEL)
    .map((country) => country.id)

  return {
    courseId: course.id,
    currentHole: 1,
    picks: [],
    draftedGolferIds: new Set(),
    countryDraftCounts,
    countryBenches,
    wheelCountryIds,
    status: 'ready_to_spin',
  }
}

export function spinWheel(state: DraftState, rng: Rng): DraftState {
  if (state.status !== 'ready_to_spin') return state
  if (state.wheelCountryIds.length === 0) {
    throw new Error('spinWheel called with no countries left on the wheel')
  }

  const targetCountryId =
    state.wheelCountryIds[randomIndex(rng, state.wheelCountryIds.length)]

  return {
    ...state,
    pendingSpinCountryId: targetCountryId,
    status: 'spinning',
  }
}

export function drawGolfers(state: DraftState, rng: Rng): DraftState {
  if (state.status !== 'spinning' || !state.pendingSpinCountryId) return state

  const bench = state.countryBenches[state.pendingSpinCountryId]
  if (bench.length < GOLFERS_OFFERED_PER_SPIN) {
    throw new Error(
      `Country ${state.pendingSpinCountryId} has fewer than ${GOLFERS_OFFERED_PER_SPIN} golfers left`,
    )
  }

  const pool = [...bench]
  const options: string[] = []
  for (let i = 0; i < GOLFERS_OFFERED_PER_SPIN; i++) {
    const idx = randomIndex(rng, pool.length)
    options.push(pool[idx])
    pool.splice(idx, 1)
  }

  return {
    ...state,
    pendingGolferOptions: options,
    status: 'awaiting_pick',
  }
}

export function applyPick(state: DraftState, golferId: string): DraftState {
  if (state.status !== 'awaiting_pick' || !state.pendingSpinCountryId) return state
  if (!state.pendingGolferOptions?.includes(golferId)) {
    throw new Error(`Golfer ${golferId} was not one of the offered options`)
  }

  const countryId = state.pendingSpinCountryId
  const remainingBench = state.countryBenches[countryId].filter(
    (id) => id !== golferId,
  )
  const newDraftCount = state.countryDraftCounts[countryId] + 1

  const stillEligible =
    newDraftCount < REPEAT_CAP && remainingBench.length >= MIN_BENCH_TO_STAY_ON_WHEEL

  const wheelCountryIds = stillEligible
    ? state.wheelCountryIds
    : state.wheelCountryIds.filter((id) => id !== countryId)

  const pick = {
    holeNumber: state.currentHole,
    countryId,
    golferId,
  }

  const nextHole = state.currentHole + 1
  const draftedGolferIds = new Set(state.draftedGolferIds)
  draftedGolferIds.add(golferId)

  return {
    ...state,
    picks: [...state.picks, pick],
    draftedGolferIds,
    countryDraftCounts: {
      ...state.countryDraftCounts,
      [countryId]: newDraftCount,
    },
    countryBenches: {
      ...state.countryBenches,
      [countryId]: remainingBench,
    },
    wheelCountryIds,
    currentHole: nextHole,
    pendingSpinCountryId: undefined,
    pendingGolferOptions: undefined,
    status: nextHole > TOTAL_HOLES ? 'complete' : 'ready_to_spin',
  }
}
