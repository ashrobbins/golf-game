import type { ArchetypeTag, Golfer } from '../../content/types'

// Ranked (best-to-worst) fit of every archetype for a given hole archetype.
// Index 0 is always the exact match; the rest encode which skills transfer,
// and how well, when a golfer's archetype isn't the hole's primary demand.
const ARCHETYPE_AFFINITY_RANKING: Record<ArchetypeTag, ArchetypeTag[]> = {
  long_hitter: ['long_hitter', 'precision_iron', 'closer', 'scrambler', 'short_game_specialist'],
  precision_iron: ['precision_iron', 'long_hitter', 'closer', 'short_game_specialist', 'scrambler'],
  short_game_specialist: ['short_game_specialist', 'scrambler', 'closer', 'precision_iron', 'long_hitter'],
  scrambler: ['scrambler', 'short_game_specialist', 'closer', 'precision_iron', 'long_hitter'],
  closer: ['closer', 'scrambler', 'short_game_specialist', 'precision_iron', 'long_hitter'],
}

const RANK_COUNT = 5

// A second archetype never lets a weaker primary overtake a strong
// single-archetype specialist — it only adds a partial top-up on top of
// the best-fitting archetype's own weight.
const SECOND_ARCHETYPE_BONUS_FACTOR = 0.15

function rankWeight(rank: number): number {
  return 1 - rank / (RANK_COUNT - 1)
}

// How well a single archetype fits a hole, from 1 (exact match) down to 0
// (the weakest possible fit for that hole).
export function archetypeFitWeight(archetype: ArchetypeTag, holeArchetype: ArchetypeTag): number {
  return rankWeight(ARCHETYPE_AFFINITY_RANKING[holeArchetype].indexOf(archetype))
}

// Overall 0..1 fit of a golfer (who may carry one or two archetypes) for a
// hole. Legends and elite players who carry two archetypes get a bonus for
// the second one, which is how "more archetypes = better odds" is modeled.
export function golferHoleFitWeight(golfer: Golfer, holeArchetype: ArchetypeTag): number {
  const [best, second] = golfer.archetypes
    .map((tag) => archetypeFitWeight(tag, holeArchetype))
    .sort((a, b) => b - a)

  if (second === undefined) return best
  return Math.min(1, best + second * SECOND_ARCHETYPE_BONUS_FACTOR)
}

// Which of a golfer's archetypes best explains their odds on this hole —
// used for display (e.g. the draft roster row), not for the odds math
// itself. Ties keep the golfer's first-listed archetype.
export function bestFitArchetype(golfer: Golfer, holeArchetype: ArchetypeTag): ArchetypeTag {
  return golfer.archetypes.reduce((best, tag) =>
    archetypeFitWeight(tag, holeArchetype) > archetypeFitWeight(best, holeArchetype) ? tag : best,
  )
}
