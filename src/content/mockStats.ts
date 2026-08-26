import { golferHoleFitWeight } from '../game/simulation/affinity'
import { simulateRound } from '../game/simulation/engine'
import { mulberry32 } from '../game/rng'
import type { DraftPick } from '../game/draft/types'
import type { RoundRecord } from '../game/stats/types'
import type { CountriesContent, CoursesContent, Golfer, OddsConfig } from './types'

// Debug-only fixture for the `?simStats` URL param (see GameProvider.tsx) —
// a quick way to land on a fully populated stats page without playing 10
// real rounds first. Unlike `mockSimulationResult.ts`'s hand-crafted single
// round, this runs the *real* `simulateRound` engine against a fixed,
// curated roster (spanning every skill tier and a wide spread of
// countries/archetypes, same spirit as the mockSimulationResult roster) so
// the numbers reflect genuine game odds rather than invented ones. Rounds
// cycle across every real course and are seeded for determinism. Never
// touches localStorage — passed down as a context override instead, so it
// can never pollute real stats.
const REGULAR_GOLFERS: { golferId: string; countryId: string }[] = [
  { golferId: 'nir-mcilroy', countryId: 'northern-ireland' }, // legend
  { golferId: 'usa-nicklaus', countryId: 'usa' }, // legend
  { golferId: 'esp-ballesteros', countryId: 'spain' }, // legend
  { golferId: 'eng-fitzpatrick', countryId: 'england' }, // elite
  { golferId: 'aus-day', countryId: 'australia' }, // elite
  { golferId: 'jpn-matsuyama', countryId: 'japan' }, // elite
  { golferId: 'swe-stenson', countryId: 'sweden' }, // elite
  { golferId: 'rsa-oosthuizen', countryId: 'south-africa' }, // elite
  { golferId: 'kor-yang', countryId: 'south-korea' }, // elite
  { golferId: 'den-hojgaard-r', countryId: 'denmark' }, // elite
  { golferId: 'oth-hovland', countryId: 'others' }, // elite
  { golferId: 'can-conners', countryId: 'canada' }, // solid
  { golferId: 'nzl-lee', countryId: 'new-zealand' }, // solid
  { golferId: 'ger-jaeger', countryId: 'germany' }, // solid
  { golferId: 'mex-ortiz-c', countryId: 'mexico' }, // solid
  { golferId: 'ita-molinari-e', countryId: 'italy' }, // journeyman
  { golferId: 'wal-dredge', countryId: 'wales' }, // journeyman
  { golferId: 'irl-oconnorjr', countryId: 'ireland' }, // journeyman
]

const ROUND_COUNT = 10
const MAX_BOGEY_FREE_RETRY_SEEDS = 300

function buildGolferIndex(content: CountriesContent): Map<string, Golfer> {
  const index = new Map<string, Golfer>()
  for (const country of content.countries) {
    for (const golfer of country.golfers) index.set(golfer.id, golfer)
  }
  return index
}

function rotate<T>(items: T[], by: number): T[] {
  const n = items.length
  const offset = ((by % n) + n) % n
  return [...items.slice(offset), ...items.slice(0, offset)]
}

// Round-robin picks: hole N gets the roster golfer at (N + rotation) % 18,
// so which golfer plays which hole shifts round-to-round rather than
// repeating identically.
function randomPicks(course: CoursesContent['courses'][number], rotation: number): DraftPick[] {
  const rotated = rotate(REGULAR_GOLFERS, rotation)
  return course.holes.map((hole, i) => ({
    holeNumber: hole.number,
    countryId: rotated[i].countryId,
    golferId: rotated[i].golferId,
  }))
}

// Deliberately drafts the best-fitting roster golfer for every hole — used
// only to force at least one bogey-free round into the mock data, the same
// way a real player chasing the streak would draft.
function archetypeMatchedPicks(
  course: CoursesContent['courses'][number],
  golferIndex: Map<string, Golfer>,
): DraftPick[] {
  const used = new Set<string>()
  return course.holes.map((hole) => {
    let best = REGULAR_GOLFERS[0]
    let bestFit = -1
    for (const candidate of REGULAR_GOLFERS) {
      if (used.has(candidate.golferId)) continue
      const golfer = golferIndex.get(candidate.golferId)
      if (!golfer) continue
      const fit = golferHoleFitWeight(golfer, hole.archetype)
      if (fit > bestFit) {
        bestFit = fit
        best = candidate
      }
    }
    used.add(best.golferId)
    return { holeNumber: hole.number, countryId: best.countryId, golferId: best.golferId }
  })
}

function toRoundRecord(
  courseId: string,
  picks: DraftPick[],
  course: CoursesContent['courses'][number],
  content: CountriesContent,
  odds: OddsConfig,
  seed: number,
  playedAt: string,
): RoundRecord {
  const result = simulateRound(picks, course, content, odds, mulberry32(seed))
  return { ...result, courseId, id: `mock-${courseId}-${seed}`, playedAt }
}

export function generateMockStatsRounds(
  content: CountriesContent,
  coursesContent: CoursesContent,
  odds: OddsConfig,
): RoundRecord[] {
  const golferIndex = buildGolferIndex(content)
  const courses = coursesContent.courses
  if (courses.length === 0) return []

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  const rounds: RoundRecord[] = []
  for (let i = 0; i < ROUND_COUNT; i++) {
    const course = courses[i % courses.length]
    const picks = randomPicks(course, i)
    // Spread across the last ~20 days, oldest first, a couple of rounds a week.
    const playedAt = new Date(now - (ROUND_COUNT - i) * 2 * dayMs).toISOString()
    rounds.push(toRoundRecord(course.id, picks, course, content, odds, 1000 + i, playedAt))
  }

  if (!rounds.some((r) => r.isBogeyFreeRound)) {
    const heroCourse = courses[courses.length - 1]
    const picks = archetypeMatchedPicks(heroCourse, golferIndex)
    for (let attempt = 0; attempt < MAX_BOGEY_FREE_RETRY_SEEDS; attempt++) {
      const seed = 5000 + attempt
      const candidate = toRoundRecord(
        heroCourse.id,
        picks,
        heroCourse,
        content,
        odds,
        seed,
        new Date(now - dayMs).toISOString(),
      )
      if (candidate.isBogeyFreeRound) {
        rounds[rounds.length - 1] = candidate
        break
      }
    }
  }

  return rounds
}
