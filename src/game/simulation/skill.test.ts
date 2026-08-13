import { describe, expect, it } from 'vitest'
import type { OutcomeDistribution } from '../../content/types'
import { applySkillShift } from './skill'

const BASE: OutcomeDistribution = {
  hole_in_one: 0,
  eagle: 0.02,
  birdie: 0.25,
  par: 0.55,
  bogey_plus: 0.18,
}

const SKILLS = ['legend', 'elite', 'solid', 'journeyman'] as const

describe('applySkillShift', () => {
  it('preserves the total probability (still sums to 1) for every skill tier', () => {
    for (const skill of SKILLS) {
      const result = applySkillShift(BASE, skill)
      const sum = Object.values(result).reduce((a, b) => a + b, 0)
      expect(Math.abs(sum - 1)).toBeLessThan(1e-9)
    }
  })

  it('never pushes any tier negative or above 1', () => {
    for (const skill of SKILLS) {
      const result = applySkillShift(BASE, skill)
      for (const value of Object.values(result)) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })

  it('leaves hole_in_one and eagle untouched — skill never inflates aces or eagles', () => {
    for (const skill of SKILLS) {
      const result = applySkillShift(BASE, skill)
      expect(result.hole_in_one).toBe(BASE.hole_in_one)
      expect(result.eagle).toBe(BASE.eagle)
    }
  })

  it('is a no-op for the solid (neutral) baseline', () => {
    expect(applySkillShift(BASE, 'solid')).toEqual(BASE)
    expect(applySkillShift(BASE)).toEqual(BASE)
  })

  it('grades birdie-or-better chance monotonically with skill: legend > elite > solid > journeyman', () => {
    const birdieChance = (skill: (typeof SKILLS)[number]) => {
      const d = applySkillShift(BASE, skill)
      return d.hole_in_one + d.eagle + d.birdie
    }
    expect(birdieChance('legend')).toBeGreaterThan(birdieChance('elite'))
    expect(birdieChance('elite')).toBeGreaterThan(birdieChance('solid'))
    expect(birdieChance('solid')).toBeGreaterThan(birdieChance('journeyman'))
  })

  it('never gets close to guaranteeing an outcome: even a legend keeps a real bogey_plus chance, and a journeyman keeps a real birdie-or-better chance', () => {
    const legend = applySkillShift(BASE, 'legend')
    expect(legend.bogey_plus).toBeGreaterThan(BASE.bogey_plus * 0.4)

    const journeyman = applySkillShift(BASE, 'journeyman')
    expect(journeyman.birdie).toBeGreaterThan(0)
  })

  it('never reduces a tier by more than half its original mass, however extreme the shift', () => {
    // A distribution where 'par' is tiny relative to 'bogey_plus' stress-tests the
    // proportional-reduction split when shifting toward good outcomes.
    const skewed: OutcomeDistribution = { hole_in_one: 0, eagle: 0, birdie: 0.05, par: 0.05, bogey_plus: 0.9 }
    const result = applySkillShift(skewed, 'legend')
    expect(result.par).toBeGreaterThanOrEqual(skewed.par * 0.5 - 1e-9)
    expect(result.bogey_plus).toBeGreaterThanOrEqual(skewed.bogey_plus * 0.5 - 1e-9)
  })
})
