import { describe, expect, it } from 'vitest'
import type { ArchetypeTag, Golfer } from '../../content/types'
import { archetypeFitWeight, bestFitArchetype, golferHoleFitWeight } from './affinity'

const ARCHETYPES: ArchetypeTag[] = [
  'long_hitter',
  'precision_iron',
  'short_game_specialist',
  'scrambler',
  'closer',
]

function golfer(archetypes: Golfer['archetypes']): Golfer {
  return { id: 'g', name: 'Golfer', archetypes }
}

describe('archetypeFitWeight', () => {
  it('gives the exact match the maximum weight of 1 for every hole archetype', () => {
    for (const a of ARCHETYPES) {
      expect(archetypeFitWeight(a, a)).toBe(1)
    }
  })

  it('never scores a mismatch as high as an exact match', () => {
    for (const holeArchetype of ARCHETYPES) {
      for (const a of ARCHETYPES) {
        if (a === holeArchetype) continue
        expect(archetypeFitWeight(a, holeArchetype)).toBeLessThan(1)
      }
    }
  })

  it('on a closer hole, ranks scrambler above short_game_specialist above the rest', () => {
    const scrambler = archetypeFitWeight('scrambler', 'closer')
    const shortGame = archetypeFitWeight('short_game_specialist', 'closer')
    const precisionIron = archetypeFitWeight('precision_iron', 'closer')
    const longHitter = archetypeFitWeight('long_hitter', 'closer')

    expect(scrambler).toBeGreaterThan(shortGame)
    expect(shortGame).toBeGreaterThan(precisionIron)
    expect(precisionIron).toBeGreaterThan(longHitter)
  })

  it('on a long_hitter hole, ranks precision_iron as the best non-matching fit', () => {
    const precisionIron = archetypeFitWeight('precision_iron', 'long_hitter')
    for (const a of ['closer', 'scrambler', 'short_game_specialist'] as ArchetypeTag[]) {
      expect(precisionIron).toBeGreaterThan(archetypeFitWeight(a, 'long_hitter'))
    }
  })

  it('never returns a value outside [0, 1]', () => {
    for (const holeArchetype of ARCHETYPES) {
      for (const a of ARCHETYPES) {
        const weight = archetypeFitWeight(a, holeArchetype)
        expect(weight).toBeGreaterThanOrEqual(0)
        expect(weight).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('golferHoleFitWeight', () => {
  it('matches archetypeFitWeight for a single-archetype golfer', () => {
    const g = golfer(['scrambler'])
    expect(golferHoleFitWeight(g, 'closer')).toBe(archetypeFitWeight('scrambler', 'closer'))
  })

  it('a second archetype boosts the fit but never above 1', () => {
    const single = golfer(['scrambler'])
    const dual = golfer(['scrambler', 'closer'])
    expect(golferHoleFitWeight(dual, 'closer')).toBe(1)
    expect(golferHoleFitWeight(dual, 'closer')).toBeGreaterThanOrEqual(golferHoleFitWeight(single, 'closer'))
  })

  it('a weak second archetype cannot drag down a strong primary match', () => {
    const g = golfer(['closer', 'long_hitter'])
    expect(golferHoleFitWeight(g, 'closer')).toBeGreaterThanOrEqual(archetypeFitWeight('closer', 'closer'))
  })

  it('a second archetype never lets a weaker primary overtake a matching specialist', () => {
    const specialist = golfer(['closer'])
    const generalist = golfer(['scrambler', 'short_game_specialist'])
    expect(golferHoleFitWeight(specialist, 'closer')).toBeGreaterThan(golferHoleFitWeight(generalist, 'closer'))
  })
})

describe('bestFitArchetype', () => {
  it('returns the single archetype for a single-archetype golfer', () => {
    expect(bestFitArchetype(golfer(['scrambler']), 'closer')).toBe('scrambler')
  })

  it('picks whichever of two archetypes fits the hole better, regardless of listed order', () => {
    const g = golfer(['long_hitter', 'closer'])
    expect(bestFitArchetype(g, 'closer')).toBe('closer')
    expect(bestFitArchetype(g, 'long_hitter')).toBe('long_hitter')

    const reversed = golfer(['closer', 'long_hitter'])
    expect(bestFitArchetype(reversed, 'closer')).toBe('closer')
    expect(bestFitArchetype(reversed, 'long_hitter')).toBe('long_hitter')
  })
})
