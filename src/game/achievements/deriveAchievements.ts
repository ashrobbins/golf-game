import type { Course } from '../../content/types'
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

export type AchievementSection = 'course' | 'career' | 'iconic'

export interface Achievement {
  id: string
  name: string
  description: string
  section: AchievementSection
  isUnlocked: boolean
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

function hasAcedIslandGreen(rounds: RoundRecord[]): boolean {
  return rounds.some(
    (r) =>
      r.courseId === ISLAND_GREEN_COURSE_ID &&
      r.holeResults.some((h) => h.holeNumber === ISLAND_GREEN_HOLE_NUMBER && h.outcomeTier === 'hole_in_one'),
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

function hasScoredTheImpossibleChip(rounds: RoundRecord[]): boolean {
  return rounds.some(
    (r) =>
      r.courseId === IMPOSSIBLE_CHIP_COURSE_ID &&
      r.holeResults.some(
        (h) =>
          h.holeNumber === IMPOSSIBLE_CHIP_HOLE_NUMBER &&
          h.golferId === IMPOSSIBLE_CHIP_GOLFER_ID &&
          h.outcomeTier === 'birdie',
      ),
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

// Returns the full achievement list in display order: each course's
// bogey-free/break-60 pair (in courses.json's own order — the same order
// the home page's course grid uses), then career-wide milestones, then
// Iconic Moments. Pure function of the round history + course list, same
// pattern as game/stats/deriveStats.ts.
export function deriveAchievements(rounds: RoundRecord[], courses: Course[]): Achievement[] {
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
    id: 'break-60-everywhere',
    name: 'Break 60 everywhere',
    description: 'Break 60 at every course in the game.',
    section: 'career',
    isUnlocked: courses.length > 0 && courses.every((course) => hasBroken60At(rounds, course)),
  })
  achievements.push({
    id: 'first-hole-in-one',
    name: 'First Hole-in-One',
    description: 'Card a hole-in-one for the first time, on any course.',
    section: 'career',
    isUnlocked: hasAnyHoleInOne(rounds),
  })
  achievements.push({
    id: 'perfect-match',
    name: 'Perfect Match',
    description: "Match every golfer's archetype to their hole on all 18 holes in a single round.",
    section: 'career',
    isUnlocked: hasPerfectMatchRound(rounds),
  })
  achievements.push({
    id: 'birdie-run',
    name: 'Birdie Run',
    description: 'Card 5 birdies in a row, on any course.',
    section: 'career',
    isUnlocked: hasBirdieRun(rounds),
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
    id: 'three-peat',
    name: '3-Peat',
    description: 'Shoot 65 or under in 3 consecutive rounds.',
    section: 'career',
    isUnlocked: hasThreePeat(rounds, courses),
  })

  achievements.push({
    id: 'ace-island-green',
    name: 'Ace on the Island Green',
    description: "Make a hole-in-one on TPC Sawgrass's par-3 17th — the Island Green.",
    section: 'iconic',
    isUnlocked: hasAcedIslandGreen(rounds),
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
    isUnlocked: hasScoredTheImpossibleChip(rounds),
  })
  achievements.push({
    id: 'golden-bear',
    name: 'Golden Bear',
    description: 'Go bogey-free at Augusta National with Jack Nicklaus in the bag.',
    section: 'iconic',
    isUnlocked: hasGoneGoldenBear(rounds),
  })

  return achievements
}
