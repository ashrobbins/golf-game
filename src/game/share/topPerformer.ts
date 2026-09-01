import type { CountriesContent, Golfer } from '../../content/types'
import type { HoleResult } from '../simulation/types'
import { hashSeed } from './seed'

export interface TopPerformer {
  hole: HoleResult
  golfer: Golfer
  // Whether this hole is a genuine highlight (hole-in-one/eagle/birdie) —
  // false only for the no-standout-hole fallback, so the caller can drop
  // the gold spotlight treatment for a plain "best of a quiet round" pick.
  isHighlight: boolean
}

export function buildGolferIndex(content: CountriesContent): Map<string, Golfer> {
  const index = new Map<string, Golfer>()
  for (const country of content.countries) {
    for (const golfer of country.golfers) index.set(golfer.id, golfer)
  }
  return index
}

// Deterministic per-round pseudo-random pick for the no-standout-hole
// fallback — the same round (same courseId + hole outcomes) must always
// pick the same "random" hole, or a shared link would show a different
// spotlight hole every time it's decoded.
function stableIndex(seed: string, length: number): number {
  return hashSeed(seed) % length
}

// Picks the hole to spotlight in the share image/round-detail page:
// any hole-in-one wins outright; otherwise the best-tier hole present
// (eagle, then birdie), preferring a legend's hole within that tier; if
// nobody beat par at all, falls back to a deterministically "random" par
// hole (or, on the pathological case of an all-bogey round, any hole) so
// there's always something to show.
export function findTopPerformer(
  courseId: string,
  holeResults: HoleResult[],
  content: CountriesContent,
): TopPerformer | null {
  if (holeResults.length === 0) return null
  const golferIndex = buildGolferIndex(content)

  const holeInOne = holeResults.find((h) => h.outcomeTier === 'hole_in_one')
  if (holeInOne) {
    const golfer = golferIndex.get(holeInOne.golferId)
    if (golfer) return { hole: holeInOne, golfer, isHighlight: true }
  }

  for (const tier of ['eagle', 'birdie'] as const) {
    const holes = holeResults.filter((h) => h.outcomeTier === tier)
    if (holes.length === 0) continue
    const legendHole = holes.find((h) => golferIndex.get(h.golferId)?.skill === 'legend')
    const chosen = legendHole ?? holes[0]
    const golfer = golferIndex.get(chosen.golferId)
    if (golfer) return { hole: chosen, golfer, isHighlight: true }
  }

  const pars = holeResults.filter((h) => h.outcomeTier === 'par')
  const pool = pars.length > 0 ? pars : holeResults
  const seed = courseId + holeResults.map((h) => `${h.holeNumber}:${h.golferId}:${h.outcomeTier}`).join(',')
  const chosen = pool[stableIndex(seed, pool.length)]
  const golfer = golferIndex.get(chosen.golferId)
  if (!golfer) return null
  return { hole: chosen, golfer, isHighlight: false }
}
