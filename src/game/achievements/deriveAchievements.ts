import type { Course } from '../../content/types'
import type { RoundRecord } from '../stats/types'

// A gross-stroke threshold, not relative-to-par like everything else in the
// app — "breaking 60" is real golf terminology for shooting fewer than 60
// strokes for 18 holes, regardless of that course's own par. Since par
// varies per course (70/71/72 across the current roster), the actual
// relative-to-par bar this implies differs by course even though the rule
// itself doesn't.
const BREAK_60_STROKES = 60

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

  return achievements
}
