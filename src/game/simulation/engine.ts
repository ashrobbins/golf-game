import type { CountriesContent, Course, Golfer, OddsConfig, OutcomeDistribution, OutcomeTier } from '../../content/types'
import type { DraftPick } from '../draft/types'
import type { Rng } from '../rng'
import { golferHoleFitWeight } from './affinity'
import { applySkillShift } from './skill'
import type { HoleResult, SimulationResult } from './types'

// Blends two distributions by fit weight — 0 is fully `a` (unmatched), 1 is
// fully `b` (matched), and everything between is a smooth archetype-fit
// gradient rather than a hard matched/unmatched switch.
function lerpDistribution(a: OutcomeDistribution, b: OutcomeDistribution, t: number): OutcomeDistribution {
  const result = {} as OutcomeDistribution
  for (const tier of Object.keys(a) as OutcomeTier[]) {
    result[tier] = a[tier] + (b[tier] - a[tier]) * t
  }
  return result
}

export function resolveOutcomeTier(
  distribution: OutcomeDistribution,
  tiers: OutcomeTier[],
  rng: Rng,
): OutcomeTier {
  const roll = rng()
  let cumulative = 0
  for (const tier of tiers) {
    cumulative += distribution[tier]
    if (roll < cumulative) return tier
  }
  // Floating-point rounding safety net — lands on the last tier rather than undefined.
  return tiers[tiers.length - 1]
}

function relativeScoreFor(tier: OutcomeTier, par: number): number {
  switch (tier) {
    case 'hole_in_one':
      return 1 - par
    case 'eagle':
      return -2
    case 'birdie':
      return -1
    case 'par':
      return 0
    case 'bogey_plus':
      return 1
  }
}

function buildGolferIndex(content: CountriesContent): Map<string, Golfer> {
  const index = new Map<string, Golfer>()
  for (const country of content.countries) {
    for (const golfer of country.golfers) {
      index.set(golfer.id, golfer)
    }
  }
  return index
}

export function simulateRound(
  picks: DraftPick[],
  course: Course,
  content: CountriesContent,
  odds: OddsConfig,
  rng: Rng = Math.random,
): SimulationResult {
  const golferIndex = buildGolferIndex(content)
  const holesByNumber = new Map(course.holes.map((hole) => [hole.number, hole]))

  const holeResults: HoleResult[] = picks
    .slice()
    .sort((a, b) => a.holeNumber - b.holeNumber)
    .map((pick) => {
      const hole = holesByNumber.get(pick.holeNumber)
      if (!hole) {
        throw new Error(`Course ${course.id} has no hole numbered ${pick.holeNumber}`)
      }
      const golfer = golferIndex.get(pick.golferId)
      if (!golfer) {
        throw new Error(`Unknown golfer id ${pick.golferId}`)
      }

      const archetypeMatched = golfer.archetypes.includes(hole.archetype)
      const { matched, unmatched } = odds.byParType[String(hole.par) as '3' | '4' | '5']
      const fitWeight = golferHoleFitWeight(golfer, hole.archetype)
      const fitDistribution = lerpDistribution(unmatched, matched, fitWeight)
      const distribution = applySkillShift(fitDistribution, golfer.skill, fitWeight)
      const outcomeTier = resolveOutcomeTier(distribution, odds.outcomeTiers, rng)

      return {
        holeNumber: pick.holeNumber,
        golferId: pick.golferId,
        countryId: pick.countryId,
        outcomeTier,
        archetypeMatched,
        relativeScore: relativeScoreFor(outcomeTier, hole.par),
      }
    })

  const firstBogeyIndex = holeResults.findIndex((r) => r.outcomeTier === 'bogey_plus')
  const bogeyFreeThroughHole =
    firstBogeyIndex === -1 ? holeResults.length : firstBogeyIndex

  return {
    courseId: course.id,
    holeResults,
    totalStrokesToPar: holeResults.reduce((sum, r) => sum + r.relativeScore, 0),
    bogeyFreeThroughHole,
    isBogeyFreeRound: firstBogeyIndex === -1,
  }
}
