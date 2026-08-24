import { describe, expect, it } from 'vitest'
import type { OutcomeTier } from '../../content/types'
import type { HoleResult } from '../simulation/types'
import {
  bogeyFreeRoundCount,
  careerTierCount,
  deriveStats,
  deriveStatsForCourse,
  highestOutcomeCount,
  lowestOutcomeCount,
  rankGolfers,
} from './deriveStats'
import type { RoundRecord } from './types'

function makeHole(outcomeTier: OutcomeTier, holeNumber = 1, golferId = 'golfer'): HoleResult {
  return {
    holeNumber,
    golferId,
    countryId: 'country',
    outcomeTier,
    archetypeMatched: true,
    relativeScore: 0,
  }
}

function makeRoundOf(
  courseId: string,
  holes: { golferId: string; tier: OutcomeTier }[],
): RoundRecord {
  const holeResults = holes.map((h, index) => makeHole(h.tier, index + 1, h.golferId))
  return {
    id: `round-${Math.random()}`,
    playedAt: '2026-01-01T00:00:00.000Z',
    courseId,
    holeResults,
    totalStrokesToPar: 0,
    bogeyFreeThroughHole: holeResults.length,
    isBogeyFreeRound: holes.every((h) => h.tier !== 'bogey_plus'),
  }
}

function makeRound(
  courseId: string,
  tiers: OutcomeTier[],
  overrides: Partial<RoundRecord> = {},
): RoundRecord {
  const holeResults = tiers.map((tier, index) => makeHole(tier, index + 1))
  return {
    id: `round-${Math.random()}`,
    playedAt: '2026-01-01T00:00:00.000Z',
    courseId,
    holeResults,
    totalStrokesToPar: 0,
    bogeyFreeThroughHole: holeResults.length,
    isBogeyFreeRound: tiers.every((tier) => tier !== 'bogey_plus'),
    ...overrides,
  }
}

describe('bogeyFreeRoundCount', () => {
  it('counts only rounds flagged bogey-free', () => {
    const rounds = [
      makeRound('augusta', ['par', 'par']),
      makeRound('augusta', ['par', 'bogey_plus']),
    ]
    expect(bogeyFreeRoundCount(rounds)).toBe(1)
  })
})

describe('lowestOutcomeCount / highestOutcomeCount', () => {
  it('returns null for an empty round list', () => {
    expect(lowestOutcomeCount([], 'bogey_plus')).toBeNull()
    expect(highestOutcomeCount([], 'birdie')).toBeNull()
  })

  it('finds the min and max tier counts across rounds', () => {
    const rounds = [
      makeRound('augusta', ['bogey_plus', 'bogey_plus', 'birdie']),
      makeRound('augusta', ['par', 'par', 'birdie', 'birdie']),
    ]
    expect(lowestOutcomeCount(rounds, 'bogey_plus')).toBe(0)
    expect(highestOutcomeCount(rounds, 'bogey_plus')).toBe(2)
    expect(highestOutcomeCount(rounds, 'birdie')).toBe(2)
  })
})

describe('careerTierCount', () => {
  it('sums a tier across every round', () => {
    const rounds = [
      makeRound('augusta', ['hole_in_one', 'par']),
      makeRound('carnoustie', ['hole_in_one', 'hole_in_one']),
    ]
    expect(careerTierCount(rounds, 'hole_in_one')).toBe(3)
  })
})

describe('deriveStats', () => {
  it('returns null-safe defaults with no rounds', () => {
    expect(deriveStats([])).toEqual({
      roundsPlayed: 0,
      bogeyFreeRounds: 0,
      lowestBogeyCount: null,
      highestBirdieCount: null,
      highestEagleCount: null,
      holeInOnes: 0,
    })
  })

  it('aggregates across every stored round', () => {
    const rounds = [
      makeRound('augusta', ['par', 'birdie', 'bogey_plus']),
      makeRound('augusta', ['birdie', 'birdie', 'eagle', 'hole_in_one']),
    ]
    expect(deriveStats(rounds)).toEqual({
      roundsPlayed: 2,
      bogeyFreeRounds: 1,
      lowestBogeyCount: 0,
      highestBirdieCount: 2,
      highestEagleCount: 1,
      holeInOnes: 1,
    })
  })
})

describe('deriveStatsForCourse', () => {
  it('filters to only the requested course before deriving', () => {
    const rounds = [
      makeRound('augusta', ['eagle']),
      makeRound('carnoustie', ['eagle', 'eagle']),
    ]
    expect(deriveStatsForCourse(rounds, 'carnoustie').highestEagleCount).toBe(2)
    expect(deriveStatsForCourse(rounds, 'augusta').highestEagleCount).toBe(1)
    expect(deriveStatsForCourse(rounds, 'unknown').roundsPlayed).toBe(0)
  })
})

describe('rankGolfers', () => {
  it('excludes golfers below the minimum holes-played threshold', () => {
    const rounds = [
      makeRoundOf('augusta', [
        { golferId: 'one-hit-wonder', tier: 'hole_in_one' },
        { golferId: 'grinder', tier: 'par' },
        { golferId: 'grinder', tier: 'par' },
        { golferId: 'grinder', tier: 'par' },
      ]),
    ]
    const ranking = rankGolfers(rounds)
    expect(ranking.map((g) => g.golferId)).toEqual(['grinder'])
  })

  it('weights a single eagle above two pars', () => {
    const rounds = [
      makeRoundOf('augusta', [
        // One eagle plus one par (3 pts) still beats three pars (3 pts)
        // isn't a fair fight at equal hole counts, so compare at the same
        // 3-hole sample size: eagle + 2 pars (4+1+1=6) vs. 3 pars (1+1+1=3).
        { golferId: 'eagle-golfer', tier: 'eagle' },
        { golferId: 'eagle-golfer', tier: 'par' },
        { golferId: 'eagle-golfer', tier: 'par' },
        { golferId: 'par-golfer', tier: 'par' },
        { golferId: 'par-golfer', tier: 'par' },
        { golferId: 'par-golfer', tier: 'par' },
      ]),
    ]
    const ranking = rankGolfers(rounds)
    const eagleGolfer = ranking.find((g) => g.golferId === 'eagle-golfer')
    const parGolfer = ranking.find((g) => g.golferId === 'par-golfer')
    expect(eagleGolfer?.points).toBe(6)
    expect(parGolfer?.points).toBe(3)
    expect(eagleGolfer?.points).toBeGreaterThan(parGolfer?.points ?? 0)
  })

  it('sorts by points, then holes played, then golfer id as a stable tiebreak', () => {
    const rounds = [
      makeRoundOf('augusta', [
        { golferId: 'b-golfer', tier: 'par' },
        { golferId: 'b-golfer', tier: 'par' },
        { golferId: 'b-golfer', tier: 'par' },
        { golferId: 'a-golfer', tier: 'par' },
        { golferId: 'a-golfer', tier: 'par' },
        { golferId: 'a-golfer', tier: 'par' },
        { golferId: 'top-golfer', tier: 'hole_in_one' },
        { golferId: 'top-golfer', tier: 'par' },
        { golferId: 'top-golfer', tier: 'par' },
      ]),
    ]
    const ranking = rankGolfers(rounds)
    expect(ranking.map((g) => g.golferId)).toEqual(['top-golfer', 'a-golfer', 'b-golfer'])
  })

  it('respects a custom minimum holes-played threshold', () => {
    const rounds = [
      makeRoundOf('augusta', [{ golferId: 'newcomer', tier: 'eagle' }]),
    ]
    expect(rankGolfers(rounds, 1)).toHaveLength(1)
    expect(rankGolfers(rounds, 3)).toHaveLength(0)
  })

  it('tracks a per-tier breakdown of how the points total was earned', () => {
    const rounds = [
      makeRoundOf('augusta', [
        { golferId: 'mixed-bag', tier: 'hole_in_one' },
        { golferId: 'mixed-bag', tier: 'birdie' },
        { golferId: 'mixed-bag', tier: 'birdie' },
        { golferId: 'mixed-bag', tier: 'bogey_plus' },
      ]),
    ]
    const golfer = rankGolfers(rounds).find((g) => g.golferId === 'mixed-bag')
    expect(golfer?.tierCounts).toEqual({
      hole_in_one: 1,
      eagle: 0,
      birdie: 2,
      par: 0,
      bogey_plus: 1,
    })
  })
})
