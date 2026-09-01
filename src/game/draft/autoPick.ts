import { ALL_ARCHETYPES } from '../../content/formatArchetype'
import type { ArchetypeTag, Course, Golfer } from '../../content/types'
import type { Rng } from '../rng'
import { randomIndex } from '../rng'
import { applyPick, drawGolfers, spinWheel } from './engine'
import type { DraftState } from './types'

const ARCHETYPE_INDEX: Record<ArchetypeTag, number> = Object.fromEntries(
  ALL_ARCHETYPES.map((tag, i) => [tag, i]),
) as Record<ArchetypeTag, number>

// Adjacent means next to each other in ALL_ARCHETYPES's own order (long_hitter,
// precision_iron, short_game_specialist, scrambler, closer) — the two end
// tags (long_hitter, closer) have exactly one neighbor, the middle three
// have two.
export function isAdjacentArchetype(a: ArchetypeTag, b: ArchetypeTag): boolean {
  return Math.abs(ARCHETYPE_INDEX[a] - ARCHETYPE_INDEX[b]) === 1
}

function hasMatchingArchetype(golfer: Golfer, holeArchetype: ArchetypeTag): boolean {
  return golfer.archetypes.includes(holeArchetype)
}

function hasAdjacentArchetype(golfer: Golfer, holeArchetype: ArchetypeTag): boolean {
  return golfer.archetypes.some((tag) => isAdjacentArchetype(tag, holeArchetype))
}

// Lower is better. Mirrors the priority order specified for auto-pick:
// 1. legend + matching archetype, 2. non-legend + matching archetype,
// 3. legend + adjacent archetype, 4. non-legend + adjacent archetype,
// 5. any legend, 6. anyone else (resolved at random among ties below).
function tierFor(golfer: Golfer, holeArchetype: ArchetypeTag): number {
  const isLegend = golfer.skill === 'legend'
  const matches = hasMatchingArchetype(golfer, holeArchetype)
  const adjacent = hasAdjacentArchetype(golfer, holeArchetype)

  if (isLegend && matches) return 1
  if (!isLegend && matches) return 2
  if (isLegend && adjacent) return 3
  if (!isLegend && adjacent) return 4
  if (isLegend) return 5
  return 6
}

// Picks the best of the offered candidates for this hole. Multiple
// candidates can land in the same best tier (e.g. two legends who both
// exactly match) — resolved uniformly at random among them, the same way
// the spec's own tier 6 ("random non-legend from the 3 available picks")
// resolves when nothing distinguishes the candidates at all.
export function chooseAutoPick(
  candidateIds: string[],
  holeArchetype: ArchetypeTag,
  golferIndex: Map<string, Golfer>,
  rng: Rng = Math.random,
): string {
  const ranked = candidateIds.map((id) => {
    const golfer = golferIndex.get(id)
    if (!golfer) throw new Error(`Auto-pick candidate ${id} is not in golferIndex`)
    return { id, tier: tierFor(golfer, holeArchetype) }
  })

  const bestTier = Math.min(...ranked.map((c) => c.tier))
  const finalists = ranked.filter((c) => c.tier === bestTier)
  return finalists[randomIndex(rng, finalists.length)].id
}

// Resolves an entire draft synchronously, hole by hole, without any UI in
// between — used for "Auto-Pick" on the course preview page, which should
// land straight on the finished bag rather than stepping through 18 holes
// of reel spins with the buttons just hidden. Pure function over the same
// engine primitives the real (manual, UI-driven) draft uses one dispatch at
// a time, so the two paths can never disagree about what a valid draft
// looks like.
export function autoCompleteDraft(
  state: DraftState,
  course: Course,
  golferIndex: Map<string, Golfer>,
  rng: Rng = Math.random,
): DraftState {
  let current = state

  while (current.status !== 'complete') {
    if (current.status === 'ready_to_spin') {
      current = spinWheel(current, rng)
      continue
    }
    if (current.status === 'spinning') {
      current = drawGolfers(current, rng)
      continue
    }
    // 'awaiting_pick'
    if (!current.pendingGolferOptions) break
    const hole = course.holes.find((h) => h.number === current.currentHole)
    if (!hole) break
    const golferId = chooseAutoPick(current.pendingGolferOptions, hole.archetype, golferIndex, rng)
    current = applyPick(current, golferId)
  }

  return current
}
