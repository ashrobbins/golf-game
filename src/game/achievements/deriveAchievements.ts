import type { ArchetypeTag, CountriesContent, Course } from '../../content/types'
import { buildGolferIndex } from '../share/topPerformer'
import { TIER_POINTS } from '../stats/deriveStats'
import type { RoundRecord } from '../stats/types'

// A gross-stroke threshold, not relative-to-par like everything else in the
// app — "breaking 60" is real golf terminology for shooting fewer than 60
// strokes for 18 holes, regardless of that course's own par. Since par
// varies per course (70/71/72 across the current roster), the actual
// relative-to-par bar this implies differs by course even though the rule
// itself doesn't.
const BREAK_60_STROKES = 60

const BIRDIE_RUN_LENGTH = 5
const BOGEY_FREE_ROUNDS_TIER_1 = 5
const BOGEY_FREE_ROUNDS_TIER_2 = 10

// A gross-stroke threshold, same convention as BREAK_60_STROKES above —
// "shoot 65 or under" is a real total, not a relative-to-par count.
const THREE_PEAT_MAX_GROSS_SCORE = 65
const THREE_PEAT_ROUND_COUNT = 3

// Iconic Moments — tied to specific real holes on specific real courses,
// not derived generically from the course list the way the per-course
// achievements above are. Hardcoded course/hole numbers rather than looked
// up by name, matching how the rest of the game already treats course
// content as static data. If either course is ever removed from
// courses.json, these simply stay permanently locked rather than erroring
// — a round can still reference an old courseId even if it's no longer in
// the active list.
const ISLAND_GREEN_COURSE_ID = 'tpc-sawgrass'
const ISLAND_GREEN_HOLE_NUMBER = 17 // TPC Sawgrass's famous par-3 17th.

const AMEN_CORNER_COURSE_ID = 'augusta-national'
const AMEN_CORNER_HOLE_NUMBERS = [11, 12, 13] // Augusta National's real Amen Corner.

// Tiger Woods's chip-in birdie on Augusta National's 16th in the final round
// of the 2005 Masters. Tied to his golfer id from countries.json rather than
// his name, matching how the rest of the sim identifies golfers.
const IMPOSSIBLE_CHIP_COURSE_ID = 'augusta-national'
const IMPOSSIBLE_CHIP_HOLE_NUMBER = 16
const IMPOSSIBLE_CHIP_GOLFER_ID = 'usa-woods'

// Jack Nicklaus went bogey-free at Augusta National — the "Golden Bear"
// nickname is his, not the achievement's own invention.
const GOLDEN_BEAR_COURSE_ID = 'augusta-national'
const GOLDEN_BEAR_GOLFER_ID = 'usa-nicklaus'

const POSTCARD_PERFECT_COURSE_ID = 'pebble-beach'
const POSTCARD_PERFECT_HOLE_NUMBER = 7 // Pebble Beach's famous, tiny, endlessly-photographed par-3 7th.

// Miguel Angel Jimenez's 2010 Open: his tee shot on the Road Hole finished
// against the boundary wall, and he still escaped with a par.
const JIMENEZ_ESCAPE_COURSE_ID = 'st-andrews'
const JIMENEZ_ESCAPE_HOLE_NUMBER = 17
const JIMENEZ_ESCAPE_GOLFER_ID = 'esp-jimenez'

const MIRACLE_AT_MEDINAH_COURSE_ID = 'medinah'
const MIRACLE_AT_MEDINAH_HOLE_NUMBER = 18
const MIRACLE_AT_MEDINAH_GOLFER_ID = 'eng-poulter'

// Six legends, five birdies each, across the whole round history — not
// tied to any single round the way the other Iconic Moments are.
const GRAND_SLAM_GOLFER_IDS = ['usa-nicklaus', 'rsa-player', 'usa-woods', 'nir-mcilroy', 'usa-hogan', 'usa-sarazen']
const GRAND_SLAM_BIRDIES_PER_GOLFER = 5

// Total points a golfer earns across a round uses the same per-tier point
// values as the Top Players leaderboard (game/stats/deriveStats.ts) — this
// achievement counts only the slice of that scoring earned by golfers with
// the 'legend' skill tier, summed across every round ever played.
const LEGENDARY_STUFF_TARGET = 1000

export type AchievementSection =  'career' | 'iconic' | 'course'

export interface AchievementProgress {
  current: number
  target: number
}

export interface AchievementRosterEntry {
  name: string
  achieved: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  section: AchievementSection
  isUnlocked: boolean
  // Optional current/target pair for achievements that track toward a
  // numeric goal rather than unlocking on a single qualifying round (e.g.
  // Legendary Stuff's running legend-points total) — rendered as an
  // "X/Y" badge by the reusable AchievementProgress UI component.
  progress?: AchievementProgress
  // Optional named checklist for achievements that require the same thing
  // from several different people (e.g. The Grand Slam's six golfers) —
  // rendered as a highlighted name list by the reusable AchievementRoster
  // UI component, so it's obvious at a glance who's left.
  roster?: AchievementRosterEntry[]
}

function isBogeyFreeAt(rounds: RoundRecord[], courseId: string): boolean {
  return rounds.some((r) => r.courseId === courseId && r.isBogeyFreeRound)
}

function hasBroken60At(rounds: RoundRecord[], course: Course): boolean {
  return rounds.some((r) => r.courseId === course.id && course.par + r.totalStrokesToPar < BREAK_60_STROKES)
}

function hasAnyHoleInOne(rounds: RoundRecord[]): boolean {
  return rounds.some((r) => r.holeResults.some((h) => h.outcomeTier === 'hole_in_one'))
}

function hasHoleInOneAt(rounds: RoundRecord[], courseId: string, holeNumber: number): boolean {
  return rounds.some(
    (r) =>
      r.courseId === courseId && r.holeResults.some((h) => h.holeNumber === holeNumber && h.outcomeTier === 'hole_in_one'),
  )
}

function hasPlayedAmenCornerUnderPar(rounds: RoundRecord[]): boolean {
  return rounds.some((r) => {
    if (r.courseId !== AMEN_CORNER_COURSE_ID) return false
    const amenCornerScore = r.holeResults
      .filter((h) => AMEN_CORNER_HOLE_NUMBERS.includes(h.holeNumber))
      .reduce((sum, h) => sum + h.relativeScore, 0)
    return amenCornerScore < 0
  })
}

function hasBirdieAt(rounds: RoundRecord[], courseId: string, holeNumber: number, golferId: string): boolean {
  return rounds.some(
    (r) =>
      r.courseId === courseId &&
      r.holeResults.some((h) => h.holeNumber === holeNumber && h.golferId === golferId && h.outcomeTier === 'birdie'),
  )
}

function hasPerfectMatchRound(rounds: RoundRecord[]): boolean {
  return rounds.some((r) => r.holeResults.length === 18 && r.holeResults.every((h) => h.archetypeMatched))
}

// holeResults is already sorted by holeNumber (see engine.ts), so a run of
// consecutive birdies in the array is a run of consecutive holes.
function hasBirdieRun(rounds: RoundRecord[]): boolean {
  return rounds.some((r) => {
    let streak = 0
    for (const h of r.holeResults) {
      streak = h.outcomeTier === 'birdie' ? streak + 1 : 0
      if (streak >= BIRDIE_RUN_LENGTH) return true
    }
    return false
  })
}

function bogeyFreeRoundCount(rounds: RoundRecord[]): number {
  return rounds.filter((r) => r.isBogeyFreeRound).length
}

function hasGoneGoldenBear(rounds: RoundRecord[]): boolean {
  return rounds.some(
    (r) =>
      r.courseId === GOLDEN_BEAR_COURSE_ID &&
      r.isBogeyFreeRound &&
      r.holeResults.some((h) => h.golferId === GOLDEN_BEAR_GOLFER_ID),
  )
}

// Consecutive by play order, not consecutive within a single course — a
// round on a course with no par data on record simply breaks the streak
// rather than crashing, same "stay locked" fallback as the other
// hardcoded-course achievements above.
function hasThreePeat(rounds: RoundRecord[], courses: Course[]): boolean {
  const sorted = [...rounds].sort((a, b) => a.playedAt.localeCompare(b.playedAt))
  let streak = 0
  for (const r of sorted) {
    const course = courses.find((c) => c.id === r.courseId)
    const grossScore = course ? course.par + r.totalStrokesToPar : null
    streak = grossScore !== null && grossScore <= THREE_PEAT_MAX_GROSS_SCORE ? streak + 1 : 0
    if (streak >= THREE_PEAT_ROUND_COUNT) return true
  }
  return false
}

function hasBogeyFreeRoundWithoutLegends(rounds: RoundRecord[], countries: CountriesContent): boolean {
  const golferIndex = buildGolferIndex(countries)
  return rounds.some(
    (r) => r.isBogeyFreeRound && r.holeResults.every((h) => golferIndex.get(h.golferId)?.skill !== 'legend'),
  )
}

// Raw total across every round ever played — can go negative (bogey_plus
// costs a point), but the achievement's progress display floors it at 0
// (see deriveAchievements below) so the badge never reads "-3/1000".
function legendPointsEarned(rounds: RoundRecord[], countries: CountriesContent): number {
  const golferIndex = buildGolferIndex(countries)
  let total = 0
  for (const r of rounds) {
    for (const h of r.holeResults) {
      if (golferIndex.get(h.golferId)?.skill === 'legend') total += TIER_POINTS[h.outcomeTier]
    }
  }
  return total
}

function holeArchetypeAt(courses: Course[], courseId: string, holeNumber: number): ArchetypeTag | null {
  const course = courses.find((c) => c.id === courseId)
  const hole = course?.holes.find((h) => h.number === holeNumber)
  return hole?.archetype ?? null
}

function hasJimenezEscape(rounds: RoundRecord[]): boolean {
  return rounds.some(
    (r) =>
      r.courseId === JIMENEZ_ESCAPE_COURSE_ID &&
      r.holeResults.some(
        (h) =>
          h.holeNumber === JIMENEZ_ESCAPE_HOLE_NUMBER &&
          h.golferId === JIMENEZ_ESCAPE_GOLFER_ID &&
          h.relativeScore <= 0,
      ),
  )
}

function birdieCountFor(rounds: RoundRecord[], golferId: string): number {
  let count = 0
  for (const r of rounds) {
    for (const h of r.holeResults) {
      if (h.golferId === golferId && h.outcomeTier === 'birdie') count++
    }
  }
  return count
}

// One roster entry per Grand Slam golfer, each flagged once they've reached
// their own 5-birdie bar — the achievement itself only unlocks once every
// one of them has. Falls back to the raw id if a golfer is ever missing
// from countries.json, rather than dropping them from the list silently.
function grandSlamRoster(rounds: RoundRecord[], countries: CountriesContent): AchievementRosterEntry[] {
  const golferIndex = buildGolferIndex(countries)
  return GRAND_SLAM_GOLFER_IDS.map((golferId) => ({
    name: golferIndex.get(golferId)?.name ?? golferId,
    achieved: birdieCountFor(rounds, golferId) >= GRAND_SLAM_BIRDIES_PER_GOLFER,
  }))
}

// A "mismatch" birdie: the golfer who made it has golferArchetype among
// their own archetype tags, but the hole they birdied is built for a
// different archetype entirely (holeArchetype) — success despite being the
// wrong tool for the job.
function hasMismatchBirdie(
  rounds: RoundRecord[],
  courses: Course[],
  countries: CountriesContent,
  golferArchetype: ArchetypeTag,
  holeArchetype: ArchetypeTag,
): boolean {
  const golferIndex = buildGolferIndex(countries)
  return rounds.some((r) =>
    r.holeResults.some((h) => {
      if (h.outcomeTier !== 'birdie') return false
      const golfer = golferIndex.get(h.golferId)
      if (!golfer?.archetypes.includes(golferArchetype)) return false
      return holeArchetypeAt(courses, r.courseId, h.holeNumber) === holeArchetype
    }),
  )
}

// Returns the full achievement list in display order: each course's
// bogey-free/break-60 pair (in courses.json's own order — the same order
// the home page's course grid uses), then career-wide milestones, then
// Iconic Moments. Pure function of the round history + course/country
// content, same pattern as game/stats/deriveStats.ts.
export function deriveAchievements(
  rounds: RoundRecord[],
  courses: Course[],
  countries: CountriesContent,
): Achievement[] {
  const achievements: Achievement[] = []

  for (const course of courses) {
    achievements.push({
      id: `bogey-free-${course.id}`,
      name: `Bogey-free at ${course.name}`,
      description: `Go bogey-free through all 18 holes at ${course.name}.`,
      section: 'course',
      isUnlocked: isBogeyFreeAt(rounds, course.id),
    })
    achievements.push({
      id: `break-60-${course.id}`,
      name: `Break 60 at ${course.name}`,
      description: `Shoot under 60 strokes at ${course.name}.`,
      section: 'course',
      isUnlocked: hasBroken60At(rounds, course),
    })
  }

  achievements.push({
    id: 'bogey-free-everywhere',
    name: 'Bogey-free everywhere',
    description: 'Go bogey-free at every course in the game.',
    section: 'career',
    isUnlocked: courses.length > 0 && courses.every((course) => isBogeyFreeAt(rounds, course.id)),
  })
  achievements.push({
    id: 'bogey-free-5-rounds',
    name: '5 Rounds Bogey-Free',
    description: 'Go bogey-free in 5 rounds total, on any course.',
    section: 'career',
    isUnlocked: bogeyFreeRoundCount(rounds) >= BOGEY_FREE_ROUNDS_TIER_1,
  })
  achievements.push({
    id: 'bogey-free-10-rounds',
    name: '10 Rounds Bogey-Free',
    description: 'Go bogey-free in 10 rounds total, on any course.',
    section: 'career',
    isUnlocked: bogeyFreeRoundCount(rounds) >= BOGEY_FREE_ROUNDS_TIER_2,
  })
  achievements.push({
    id: 'break-60-everywhere',
    name: 'Break 60 everywhere',
    description: 'Break 60 at every course in the game.',
    section: 'career',
    isUnlocked: courses.length > 0 && courses.every((course) => hasBroken60At(rounds, course)),
  })
  achievements.push({
    id: 'three-peat',
    name: '3-Peat',
    description: 'Shoot 65 or under in 3 consecutive rounds.',
    section: 'career',
    isUnlocked: hasThreePeat(rounds, courses),
  })
  achievements.push({
    id: 'first-hole-in-one',
    name: 'First Hole-in-One',
    description: 'Card a hole-in-one for the first time, on any course.',
    section: 'career',
    isUnlocked: hasAnyHoleInOne(rounds),
  })
  achievements.push({
    id: 'birdie-run',
    name: 'Birdie Run',
    description: 'Card 5 birdies in a row, on any course.',
    section: 'career',
    isUnlocked: hasBirdieRun(rounds),
  })
  achievements.push({
    id: 'perfect-match',
    name: 'Perfect Match',
    description: "Match every golfer's archetype to their hole on all 18 holes in a single round.",
    section: 'career',
    isUnlocked: hasPerfectMatchRound(rounds),
  })
  achievements.push({
    id: 'peoples-champion',
    name: "The People's Champion",
    description: 'Go bogey-free in a round without a single legend in the bag.',
    section: 'career',
    isUnlocked: hasBogeyFreeRoundWithoutLegends(rounds, countries),
  })
  const legendPoints = legendPointsEarned(rounds, countries)
  achievements.push({
    id: 'legendary-stuff',
    name: 'Legendary Stuff',
    description: 'Earn 1,000 career points from legends alone.',
    section: 'career',
    isUnlocked: legendPoints >= LEGENDARY_STUFF_TARGET,
    progress: { current: Math.max(0, legendPoints), target: LEGENDARY_STUFF_TARGET },
  })
  achievements.push({
    id: 'take-mine-scrambled',
    name: 'I Take Mine Scrambled',
    description: 'Birdie a LONG HITTER hole with a SCRAMBLER golfer.',
    section: 'career',
    isUnlocked: hasMismatchBirdie(rounds, courses, countries, 'scrambler', 'long_hitter'),
  })
  achievements.push({
    id: 'bombs-away',
    name: 'Bombs Away',
    description: 'Birdie a SCRAMBLER hole with a LONG HITTER golfer.',
    section: 'career',
    isUnlocked: hasMismatchBirdie(rounds, courses, countries, 'long_hitter', 'scrambler'),
  })
  const grandSlamRosterEntries = grandSlamRoster(rounds, countries)
  const grandSlamComplete = grandSlamRosterEntries.filter((entry) => entry.achieved).length
  achievements.push({
    id: 'grand-slam',
    name: 'The Grand Slam',
    description: 'Card 5 birdies apiece with each of these six legends.',
    section: 'career',
    isUnlocked: grandSlamComplete >= GRAND_SLAM_GOLFER_IDS.length,
    progress: { current: grandSlamComplete, target: GRAND_SLAM_GOLFER_IDS.length },
    roster: grandSlamRosterEntries,
  })

  achievements.push({
    id: 'ace-island-green',
    name: 'Ace on the Island Green',
    description: "Make a hole-in-one on TPC Sawgrass's par-3 17th — the Island Green.",
    section: 'iconic',
    isUnlocked: hasHoleInOneAt(rounds, ISLAND_GREEN_COURSE_ID, ISLAND_GREEN_HOLE_NUMBER),
  })
  achievements.push({
    id: 'amen-corner-answered',
    name: 'Amen Corner, Prayers Answered',
    description: 'Play holes 11–13 at Augusta National — Amen Corner — under par, combined.',
    section: 'iconic',
    isUnlocked: hasPlayedAmenCornerUnderPar(rounds),
  })
  achievements.push({
    id: 'the-impossible-chip',
    name: 'The Impossible Chip',
    description: 'Score a birdie with Tiger Woods on Augusta National’s 16th.',
    section: 'iconic',
    isUnlocked: hasBirdieAt(rounds, IMPOSSIBLE_CHIP_COURSE_ID, IMPOSSIBLE_CHIP_HOLE_NUMBER, IMPOSSIBLE_CHIP_GOLFER_ID),
  })
  achievements.push({
    id: 'golden-bear',
    name: 'Golden Bear',
    description: 'Go bogey-free at Augusta National with Jack Nicklaus in the bag.',
    section: 'iconic',
    isUnlocked: hasGoneGoldenBear(rounds),
  })
  achievements.push({
    id: 'postcard-perfect',
    name: 'Postcard Perfect',
    description: "Make a hole-in-one on Pebble Beach's tiny par-3 7th.",
    section: 'iconic',
    isUnlocked: hasHoleInOneAt(rounds, POSTCARD_PERFECT_COURSE_ID, POSTCARD_PERFECT_HOLE_NUMBER),
  })
  achievements.push({
    id: 'jimenez-escape',
    name: "Jimenez's Escape",
    description: 'Make par or better on the Road Hole at St Andrews with Miguel Angel Jimenez.',
    section: 'iconic',
    isUnlocked: hasJimenezEscape(rounds),
  })
  achievements.push({
    id: 'miracle-at-medinah',
    name: 'Miracle at Medinah',
    description: "Birdie Medinah's 18th with Ian Poulter.",
    section: 'iconic',
    isUnlocked: hasBirdieAt(rounds, MIRACLE_AT_MEDINAH_COURSE_ID, MIRACLE_AT_MEDINAH_HOLE_NUMBER, MIRACLE_AT_MEDINAH_GOLFER_ID),
  })

  return achievements
}
