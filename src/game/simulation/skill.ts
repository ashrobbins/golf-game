import type { OutcomeDistribution, SkillTier } from '../../content/types'

// How much of the bogey_plus tier a skill tier shaves off (positive) or
// adds (negative), as a fraction of its current mass. Ranges scale with
// archetype fit (see applySkillShift) so a legend on their best archetype
// is dramatically better than the same legend stranded on a hole that
// doesn't suit them at all — legend's max lands a matched-archetype legend
// at roughly a 95% par-or-better chance against the real odds-config data,
// per the design brief. journeyman is flat: a bad fit is already captured
// by the archetype-fit blend, so skill alone shouldn't compound it further.
// elite.max was raised from 0.3 to 0.5 after modeling showed a realistic
// "always draft the matching archetype" round (the elite/solid/journeyman
// mix you actually get, not a legend-only fantasy bag) had only a ~1-in-12
// to 1-in-15 chance of a bogey-free round — too rare to keep players coming
// back. 0.5 brings that to ~1-in-9 to 1-in-12 depending on course, without
// touching legend (kept as-is) or solid (must stay a no-op — see the test
// asserting it's the neutral baseline the odds table itself is calibrated to).
const BOGEY_REDUCTION_RANGE: Record<SkillTier, { min: number; max: number }> = {
  legend: { min: 0.25, max: 0.65 },
  elite: { min: 0.08, max: 0.5 },
  solid: { min: 0, max: 0 },
  journeyman: { min: -0.18, max: -0.18 },
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
