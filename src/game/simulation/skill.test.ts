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
const FIT_LEVELS = [0, 0.5, 1]

describe('applySkillShift', () => {
  it('preserves the total probability (still sums to 1) for every skill tier and fit level', () => {
    for (const skill of SKILLS) {
      for (const fit of FIT_LEVELS) {
        const result = applySkillShift(BASE, skill, fit)
        const sum = Object.values(result).reduce((a, b) => a + b, 0)
        expect(Math.abs(sum - 1)).toBeLessThan(1e-9)
      }
    }
  })

  it('never pushes any tier negative or above 1', () => {
    for (const skill of SKILLS) {
      for (const fit of FIT_LEVELS) {
        const result = applySkillShift(BASE, skill, fit)
        for (const value of Object.values(result)) {
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('leaves hole_in_one and eagle untouched — skill never inflates aces or eagles', () => {
    for (const skill of SKILLS) {
      for (const fit of FIT_LEVELS) {
        const result = applySkillShift(BASE, skill, fit)
        expect(result.hole_in_one).toBe(BASE.hole_in_one)
        expect(result.eagle).toBe(BASE.eagle)
      }
    }
  })

  it('is a no-op for the solid (neutral) baseline at any fit level', () => {
    for (const fit of FIT_LEVELS) {
      expect(applySkillShift(BASE, 'solid', fit)).toEqual(BASE)
    }
    expect(applySkillShift(BASE)).toEqual(BASE)
  })

  it('grades par-or-better chance monotonically with skill: legend > elite > solid > journeyman', () => {
    const parOrBetterChance = (skill: (typeof SKILLS)[number], fit: number) => {
      const d = applySkillShift(BASE, skill, fit)
      return 1 - d.bogey_plus
    }
    for (const fit of FIT_LEVELS) {
      expect(parOrBetterChance('legend', fit)).toBeGreaterThan(parOrBetterChance('elite', fit))
      expect(parOrBetterChance('elite', fit)).toBeGreaterThan(parOrBetterChance('solid', fit))
      expect(parOrBetterChance('solid', fit)).toBeGreaterThan(parOrBetterChance('journeyman', fit))
    }
  })

  it('gives a legend a bigger boost the better their archetype fits the hole', () => {
    const bogeyChance = (fit: number) => applySkillShift(BASE, 'legend', fit).bogey_plus
    expect(bogeyChance(1)).toBeLessThan(bogeyChance(0.5))
    expect(bogeyChance(0.5)).toBeLessThan(bogeyChance(0))
  })

  it('never gets close to guaranteeing an outcome: even a legend on a perfect fit keeps a real bogey_plus chance', () => {
    const legend = applySkillShift(BASE, 'legend', 1)
    expect(legend.bogey_plus).toBeGreaterThan(0)

    const journeyman = applySkillShift(BASE, 'journeyman', 1)
    expect(journeyman.birdie).toBeGreaterThan(0)
  })
})
