import type { OutcomeDistribution, SkillTier } from '../../content/types'

const SKILL_VALUE: Record<SkillTier, number> = {
  legend: 1,
  elite: 0.75,
  solid: 0.5,
  journeyman: 0.25,
}

// Max probability-point movement at the extremes (legend vs journeyman).
const MAX_SKILL_SHIFT = 0.07
// Never cut an existing tier's probability by more than this fraction —
// guarantees no tier is ever pushed to zero, no matter how the shift stacks.
const MAX_TIER_REDUCTION_FRACTION = 0.5

// Nudges a distribution toward (or away from) better outcomes based on a
// golfer's overall skill, layered on top of whichever archetype-fit
// distribution (matched/unmatched) was already selected — this modulates
// that system, it doesn't replace it. Only moves mass between 'birdie' and
// the bad tiers ('par'/'bogey_plus'); hole_in_one/eagle stay untouched so
// skill never makes aces or eagles common. Bounded as a fraction of existing
// probability mass, so no tier can ever be pushed to zero — better players
// get better odds, never a guarantee.
export function applySkillShift(
  distribution: OutcomeDistribution,
  skill: SkillTier = 'solid',
): OutcomeDistribution {
  const shift = (SKILL_VALUE[skill] - 0.5) * 2 * MAX_SKILL_SHIFT
  if (shift === 0) return distribution

  const result = { ...distribution }

  if (shift > 0) {
    const badTotal = distribution.par + distribution.bogey_plus
    const movable = Math.min(shift, badTotal * MAX_TIER_REDUCTION_FRACTION)
    if (badTotal > 0) {
      result.par -= (distribution.par / badTotal) * movable
      result.bogey_plus -= (distribution.bogey_plus / badTotal) * movable
    }
    result.birdie += movable
  } else {
    const movable = Math.min(-shift, distribution.birdie * MAX_TIER_REDUCTION_FRACTION)
    result.birdie -= movable
    result.bogey_plus += movable
  }

  return result
}
