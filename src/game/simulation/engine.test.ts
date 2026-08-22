import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Course, OddsConfig, OutcomeTier } from '../../content/types'
import { mulberry32 } from '../rng'
import type { DraftPick } from '../draft/types'
import { resolveOutcomeTier, simulateRound } from './engine'

const oddsConfigPath = fileURLToPath(
  new URL('../../../public/content/odds-config.json', import.meta.url),
)
const realOddsConfig: OddsConfig = JSON.parse(readFileSync(oddsConfigPath, 'utf8'))

const EPSILON = 1e-9

describe('real odds-config.json content validation', () => {
  const parTypes = ['3', '4', '5'] as const

  it('every distribution sums to 1', () => {
    for (const parType of parTypes) {
      for (const fit of ['matched', 'unmatched'] as const) {
        const distribution = realOddsConfig.byParType[parType][fit]
        const sum = Object.values(distribution).reduce((a, b) => a + b, 0)
        expect(Math.abs(sum - 1)).toBeLessThan(EPSILON)
      }
    }
  })

  it('never guarantees a good outcome: every matched distribution keeps a non-zero bogey_plus floor', () => {
    for (const parType of parTypes) {
      expect(realOddsConfig.byParType[parType].matched.bogey_plus).toBeGreaterThan(0)
    }
  })

  it('never guarantees a bad outcome: every unmatched distribution keeps a non-zero birdie-or-better floor', () => {
    for (const parType of parTypes) {
      const d = realOddsConfig.byParType[parType].unmatched
      expect(d.hole_in_one + d.eagle + d.birdie).toBeGreaterThan(0)
    }
  })

  it('bakes hole-in-one probability to 0 for par 4/5 (aces are a par-3-only data fact)', () => {
    expect(realOddsConfig.byParType['4'].matched.hole_in_one).toBe(0)
    expect(realOddsConfig.byParType['4'].unmatched.hole_in_one).toBe(0)
    expect(realOddsConfig.byParType['5'].matched.hole_in_one).toBe(0)
    expect(realOddsConfig.byParType['5'].unmatched.hole_in_one).toBe(0)
  })
})

describe('resolveOutcomeTier', () => {
  const tiers = realOddsConfig.outcomeTiers

  it('produces observed frequencies within tolerance of the configured distribution', () => {
    const distribution = realOddsConfig.byParType['4'].matched
    const rng = mulberry32(42)
    const trials = 20000
    const counts: Record<OutcomeTier, number> = {
      hole_in_one: 0,
      eagle: 0,
      birdie: 0,
      par: 0,
      bogey_plus: 0,
    }

    for (let i = 0; i < trials; i++) {
      counts[resolveOutcomeTier(distribution, tiers, rng)]++
    }

    for (const tier of tiers) {
      const observed = counts[tier] / trials
      expect(Math.abs(observed - distribution[tier])).toBeLessThan(0.015)
    }
  })

  it('shifts odds toward better outcomes for a matched fit without ever reaching 100%', () => {
    const matched = realOddsConfig.byParType['4'].matched
    const unmatched = realOddsConfig.byParType['4'].unmatched
    const rng = mulberry32(7)
    const trials = 20000

    const birdieOrBetter = (d: typeof matched) => d.hole_in_one + d.eagle + d.birdie

    let matchedGood = 0
    let unmatchedGood = 0
    let matchedBogey = 0
    let unmatchedBogey = 0

    for (let i = 0; i < trials; i++) {
      const mTier = resolveOutcomeTier(matched, tiers, rng)
      if (mTier === 'hole_in_one' || mTier === 'eagle' || mTier === 'birdie') matchedGood++
      if (mTier === 'bogey_plus') matchedBogey++

      const uTier = resolveOutcomeTier(unmatched, tiers, rng)
      if (uTier === 'hole_in_one' || uTier === 'eagle' || uTier === 'birdie') unmatchedGood++
      if (uTier === 'bogey_plus') unmatchedBogey++
    }

    expect(matchedGood / trials).toBeGreaterThan(unmatchedGood / trials)
    expect(matchedBogey / trials).toBeLessThan(unmatchedBogey / trials)
    // Never a lock: even a great fit still bogeys sometimes, and a mismatch still holes some good shots.
    expect(matchedBogey).toBeGreaterThan(0)
    expect(unmatchedGood).toBeGreaterThan(0)
    expect(birdieOrBetter(matched)).toBeLessThan(1)
  })
})

describe('legend + matched archetype par-or-better rate', () => {
  const parTypes = ['3', '4', '5'] as const

  it('lands a legend on their exact archetype at roughly a 95% par-or-better rate', () => {
    for (const parType of parTypes) {
      const course: Course = {
        id: 'fixture-course',
        name: 'Fixture Course',
        par: 72,
        holes: [{ number: 1, par: Number(parType) as 3 | 4 | 5, yardage: 400, archetype: 'closer' }],
      }
      const content = {
        version: 1,
        countries: [
          {
            id: 'fixture-country',
            name: 'Fixture',
            isoCode: 'XX',
            golfers: [
              {
                id: 'legend',
                name: 'Legend Golfer',
                archetypes: ['closer'] as ['closer'],
                skill: 'legend' as const,
              },
            ],
          },
        ],
      }
      const picks: DraftPick[] = [{ holeNumber: 1, countryId: 'fixture-country', golferId: 'legend' }]
      const rng = mulberry32(11)
      const trials = 5000
      let parOrBetter = 0

      for (let i = 0; i < trials; i++) {
        const result = simulateRound(picks, course, content, realOddsConfig, rng)
        if (result.holeResults[0].outcomeTier !== 'bogey_plus') parOrBetter++
      }

      const rate = parOrBetter / trials
      expect(rate).toBeGreaterThan(0.9)
      expect(rate).toBeLessThan(1)
    }
  })
})

describe('simulateRound derived stats', () => {
  const course: Course = {
    id: 'fixture-course',
    name: 'Fixture Course',
    par: 72,
    holes: Array.from({ length: 18 }, (_, i) => ({
      number: i + 1,
      par: 4 as const,
      yardage: 400,
      archetype: 'precision_iron' as const,
    })),
  }

  const content = {
    version: 1,
    countries: [
      {
        id: 'fixture-country',
        name: 'Fixture',
        isoCode: 'XX',
        golfers: [
          { id: 'g1', name: 'Golfer One', archetypes: ['precision_iron'] as ['precision_iron'] },
        ],
      },
    ],
  }

  const picks: DraftPick[] = Array.from({ length: 18 }, (_, i) => ({
    holeNumber: i + 1,
    countryId: 'fixture-country',
    golferId: 'g1',
  }))

  it('computes bogeyFreeThroughHole and isBogeyFreeRound from the first bogey (a bogey on hole 7 breaks the streak at 6)', () => {
    // Force a deterministic sequence: rng always resolves to 'par' except we
    // stub a single roll to land on 'bogey_plus' via a custom fake distribution.
    let call = 0
    const fakeRng: () => number = () => {
      call++
      // Hole 7 is the 7th call — land it in the bogey_plus band; every other
      // call lands squarely in the 'par' band.
      return call === 7 ? 0.99 : 0.6
    }

    const result = simulateRound(picks, course, content, realOddsConfig, fakeRng)

    expect(result.holeResults[6].outcomeTier).toBe('bogey_plus')
    expect(result.bogeyFreeThroughHole).toBe(6)
    expect(result.isBogeyFreeRound).toBe(false)
  })

  it('reports a full bogey-free round and zero strokes-to-par when every hole pars', () => {
    const alwaysPar: () => number = () => 0.6 // lands in the 'par' band for a matched par-4
    const result = simulateRound(picks, course, content, realOddsConfig, alwaysPar)

    expect(result.holeResults.every((r) => r.outcomeTier === 'par')).toBe(true)
    expect(result.totalStrokesToPar).toBe(0)
    expect(result.bogeyFreeThroughHole).toBe(18)
    expect(result.isBogeyFreeRound).toBe(true)
  })
})
