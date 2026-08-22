import { describe, expect, it } from 'vitest'
import type { CountriesContent, Course } from '../../content/types'
import { mulberry32 } from '../rng'
import {
  applyPick,
  assertWheelHasCapacity,
  createInitialDraftState,
  drawGolfers,
  spinWheel,
} from './engine'
import { REPEAT_CAP, TOTAL_HOLES } from './types'

function makeCountry(id: string, benchSize: number, repeatCap?: number) {
  return {
    id,
    name: id,
    isoCode: 'XX',
    golfers: Array.from({ length: benchSize }, (_, i) => ({
      id: `${id}-g${i}`,
      name: `${id} golfer ${i}`,
      archetypes: ['long_hitter'] as ['long_hitter'],
    })),
    ...(repeatCap !== undefined ? { repeatCap } : {}),
  }
}

function makeContent(countrySpecs: Array<[string, number, number?]>): CountriesContent {
  return {
    version: 1,
    countries: countrySpecs.map(([id, size, repeatCap]) => makeCountry(id, size, repeatCap)),
  }
}

const dummyCourse: Course = {
  id: 'test-course',
  name: 'Test Course',
  par: 72,
  holes: [],
}

function driveOneHole(
  state: ReturnType<typeof createInitialDraftState>,
  rng: ReturnType<typeof mulberry32>,
) {
  let s = spinWheel(state, rng)
  s = drawGolfers(s, rng)
  const golferId = s.pendingGolferOptions![0]
  s = applyPick(s, golferId)
  return s
}

describe('createInitialDraftState', () => {
  it('excludes countries with a bench smaller than the min-to-stay-on-wheel size', () => {
    const content = makeContent([
      ['big', 8],
      ['tiny', 2],
    ])
    const state = createInitialDraftState(dummyCourse, content)
    expect(state.wheelCountryIds).toEqual(['big'])
  })
})

describe('repeat cap', () => {
  it('removes a country from the wheel once it hits the repeat cap, even with bench remaining', () => {
    // Bench of 8 easily survives 3 picks with plenty left over.
    const content = makeContent([
      ['deep', 8],
      ['other', 6],
    ])
    let state = createInitialDraftState(dummyCourse, content)
    const rng = mulberry32(1)

    // Force spins onto 'deep' by shrinking the wheel to just that country
    // for the first REPEAT_CAP holes.
    state = { ...state, wheelCountryIds: ['deep'] }
    for (let i = 0; i < REPEAT_CAP; i++) {
      state = driveOneHole(state, rng)
    }

    expect(state.countryDraftCounts['deep']).toBe(REPEAT_CAP)
    expect(state.countryBenches['deep'].length).toBe(8 - REPEAT_CAP)
    // Restore 'other' to the wheel to check 'deep' was dropped, not just this snapshot.
    expect(state.wheelCountryIds).not.toContain('deep')
  })
})

describe('per-country repeat cap override', () => {
  it('lets a country with a raised repeatCap be drafted more than the default REPEAT_CAP times', () => {
    const content = makeContent([
      ['marquee', 10, 5],
      ['ordinary', 8],
      ['other', 6],
    ])
    let state = createInitialDraftState(dummyCourse, content)
    const rng = mulberry32(3)

    expect(state.countryRepeatCaps['marquee']).toBe(5)
    expect(state.countryRepeatCaps['ordinary']).toBe(REPEAT_CAP)

    // Force spins onto 'marquee' for 5 holes — past the default REPEAT_CAP.
    // It stays on the wheel across all 5 picks on its own (stillEligible
    // keeps re-including it) since its own cap is 5, not REPEAT_CAP.
    state = { ...state, wheelCountryIds: ['marquee'] }
    for (let i = 0; i < 5; i++) {
      state = driveOneHole(state, rng)
    }

    expect(state.countryDraftCounts['marquee']).toBe(5)
    expect(state.countryBenches['marquee'].length).toBe(10 - 5)
    expect(state.wheelCountryIds).not.toContain('marquee')
  })

  it('still caps a default-cap country at REPEAT_CAP in the same run as a raised-cap one', () => {
    const content = makeContent([
      ['marquee', 10, 5],
      ['ordinary', 10],
    ])
    let state = createInitialDraftState(dummyCourse, content)
    const rng = mulberry32(4)

    state = { ...state, wheelCountryIds: ['ordinary'] }
    for (let i = 0; i < REPEAT_CAP; i++) {
      state = driveOneHole(state, rng)
    }

    expect(state.countryDraftCounts['ordinary']).toBe(REPEAT_CAP)
    expect(state.wheelCountryIds).not.toContain('ordinary')
  })
})

describe('bench exhaustion', () => {
  it('removes a country from the wheel once its remaining bench drops below the minimum, independent of the cap', () => {
    // Bench of exactly 3 (minimum to be offered) — one pick drops it to 2,
    // which is below MIN_BENCH_TO_STAY_ON_WHEEL, well before hitting REPEAT_CAP.
    const content = makeContent([['thin', 3]])
    let state = createInitialDraftState(dummyCourse, content)
    const rng = mulberry32(2)

    state = driveOneHole(state, rng)

    expect(state.countryDraftCounts['thin']).toBe(1)
    expect(state.countryBenches['thin'].length).toBe(2)
    expect(state.wheelCountryIds).not.toContain('thin')
  })
})

describe('no duplicates', () => {
  it('never offers or drafts the same golfer twice across the whole draft', () => {
    const content = makeContent([
      ['a', 8],
      ['b', 8],
      ['c', 8],
      ['d', 8],
      ['e', 8],
      ['f', 8],
      ['g', 8],
      ['h', 8],
    ])

    for (let seed = 0; seed < 50; seed++) {
      const rng = mulberry32(seed)
      let state = createInitialDraftState(dummyCourse, content)
      const draftedIds = new Set<string>()

      while (state.status !== 'complete') {
        state = spinWheel(state, rng)
        state = drawGolfers(state, rng)
        for (const offered of state.pendingGolferOptions!) {
          expect(draftedIds.has(offered)).toBe(false)
        }
        const golferId = state.pendingGolferOptions![0]
        state = applyPick(state, golferId)
        expect(draftedIds.has(golferId)).toBe(false)
        draftedIds.add(golferId)
      }
    }
  })
})

describe('full-round invariants', () => {
  it('always completes an 18-hole draft without stalling, respecting the repeat cap, across many seeds', () => {
    const content = makeContent([
      ['a', 8],
      ['b', 7],
      ['c', 6],
      ['d', 8],
      ['e', 6],
      ['f', 8],
      ['g', 7],
      ['h', 6],
    ])
    assertWheelHasCapacity(content)

    for (let seed = 0; seed < 200; seed++) {
      const rng = mulberry32(seed * 7919 + 13)
      let state = createInitialDraftState(dummyCourse, content)
      let iterations = 0

      while (state.status !== 'complete') {
        iterations++
        if (iterations > TOTAL_HOLES * 2) {
          throw new Error(`Draft stalled at seed ${seed}, hole ${state.currentHole}`)
        }
        state = spinWheel(state, rng)
        state = drawGolfers(state, rng)
        const golferId = state.pendingGolferOptions![0]
        state = applyPick(state, golferId)
      }

      expect(state.picks.length).toBe(TOTAL_HOLES)
      expect(new Set(state.picks.map((p) => p.golferId)).size).toBe(TOTAL_HOLES)
      for (const count of Object.values(state.countryDraftCounts)) {
        expect(count).toBeLessThanOrEqual(REPEAT_CAP)
      }
    }
  })

  it('throws a loud error at content-load time if total capacity cannot fill 18 holes', () => {
    const thinContent = makeContent([
      ['a', 4],
      ['b', 3],
    ])
    expect(() => assertWheelHasCapacity(thinContent)).toThrow()
  })
})
