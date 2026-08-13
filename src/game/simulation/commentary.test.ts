import { describe, expect, it } from 'vitest'
import type { Golfer, Hole, OutcomeTier } from '../../content/types'
import { mulberry32 } from '../rng'
import { generateHoleCommentary } from './commentary'

const TIERS: OutcomeTier[] = ['hole_in_one', 'eagle', 'birdie', 'par', 'bogey_plus']
const PARS = [3, 4, 5] as const

const golfer: Golfer = {
  id: 'test-golfer',
  name: 'Roberto De Vicenzo',
  archetypes: ['precision_iron'],
}

function makeHole(par: 3 | 4 | 5): Hole {
  return { number: 1, par, yardage: 400, archetype: 'precision_iron' }
}

describe('generateHoleCommentary', () => {
  it('never leaves an unfilled {placeholder} for any tier/fit/par combination', () => {
    const rng = mulberry32(1)
    for (const tier of TIERS) {
      for (const matched of [true, false]) {
        for (const par of PARS) {
          for (let i = 0; i < 20; i++) {
            const line = generateHoleCommentary(golfer, makeHole(par), tier, matched, rng)
            expect(line).not.toMatch(/\{[a-z]+\}/)
          }
        }
      }
    }
  })

  it("always includes the golfer's surname, not the full name", () => {
    const rng = mulberry32(2)
    const line = generateHoleCommentary(golfer, makeHole(4), 'birdie', true, rng)
    expect(line).toContain('De Vicenzo')
    expect(line).not.toContain('Roberto De Vicenzo')
  })

  it('uses "tee shot" phrasing on a par 3 and "approach" on a par 4/5 for shot-quality templates', () => {
    // Seed a run long enough to hit a template that actually contains {shot}.
    const rng = mulberry32(3)
    let sawTeeShot = false
    let sawApproach = false
    for (let i = 0; i < 50; i++) {
      const par3Line = generateHoleCommentary(golfer, makeHole(3), 'birdie', true, rng)
      const par4Line = generateHoleCommentary(golfer, makeHole(4), 'birdie', true, rng)
      if (par3Line.includes('tee shot')) sawTeeShot = true
      if (par4Line.includes('approach')) sawApproach = true
    }
    expect(sawTeeShot).toBe(true)
    expect(sawApproach).toBe(true)
  })

  it('falls back to Math.random when no rng is supplied, without throwing', () => {
    expect(() => generateHoleCommentary(golfer, makeHole(3), 'par', true)).not.toThrow()
  })
})
