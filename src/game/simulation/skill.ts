import type { OutcomeDistribution, SkillTier } from '../../content/types'

// How much of the bogey_plus tier a skill tier shaves off (positive) or
// adds (negative), as a fraction of its current mass. Ranges scale with
// archetype fit (see applySkillShift) so a legend on their best archetype
// is dramatically better than the same legend stranded on a hole that
// doesn't suit them at all. journeyman is flat: a bad fit is already
// captured by the archetype-fit blend, so skill alone shouldn't compound
// it further. solid stays a no-op — the neutral baseline the odds table
// itself is calibrated to (see the test asserting this).
//
// Raised again (legend .65→.9, elite .5→.85, journeyman -.18→-.12) plus a
// softer odds-config.json 'unmatched' table, per explicit user request:
// modeling showed the realistic "always draft the matching archetype"
// round (the elite/solid/journeyman mix you actually get) had only a
// ~1-in-9 to 1-in-12 chance of a bogey-free round, and typical random
// gameplay only ~1-in-50 — both judged too rare. This combination brings
// archetype-match play to ~1-in-5 to 1-in-6 and normal gameplay to
// ~1-in-14 to 1-in-16 across all 4 courses (verified via a 150k-iteration
// Monte Carlo sweep per course/strategy, not just the single-hole fixture
// test below).
const BOGEY_REDUCTION_RANGE: Record<SkillTier, { min: number; max: number }> = {
  legend: { min: 0.32, max: 0.9 },
  elite: { min: 0.1, max: 0.85 },
  solid: { min: 0, max: 0 },
  journeyman: { min: -0.12, max: -0.12 },
}

// Nudges a distribution toward (or away from) better outcomes based on a
// golfer's overall skill and how well their archetype(s) fit the hole
// (0 = worst possible fit, 1 = exact archetype match), layered on top of
// whichever fit-blended distribution was already selected — this modulates
// that system, it doesn't replace it. Only moves mass between 'birdie' and
// 'bogey_plus'; hole_in_one/eagle stay untouched so skill never makes aces
// or eagles common. The reduction fraction is capped below 1, so bogey_plus
// can never be pushed to zero — better players get better odds, never a
// guarantee.
export function applySkillShift(
  distribution: OutcomeDistribution,
  skill: SkillTier = 'solid',
  archetypeFit = 0.5,
): OutcomeDistribution {
  const { min, max } = BOGEY_REDUCTION_RANGE[skill]
  const reduction = min + (max - min) * archetypeFit
  if (reduction === 0) return distribution

  const result = { ...distribution }

  if (reduction > 0) {
    const moved = distribution.bogey_plus * reduction
    result.bogey_plus -= moved
    result.birdie += moved
  } else {
    const moved = distribution.birdie * -reduction
    result.birdie -= moved
    result.bogey_plus += moved
  }

  return result
}
