import { describe, expect, it } from 'vitest'
import type { Course } from '../../content/types'
import type { CompletedSeason, SeasonRoundResult } from './types'
import { MAJOR_COURSE_IDS, buildSchedule, createSeason, isSeasonComplete, recordSeasonRoundResult } from './storage'

function course(id: string): Course {
  return { id, name: id, par: 72, holes: [] }
}

// 16 courses: the 4 majors plus 12 regular ones, matching the real
// courses.json shape (order shouldn't matter for majors, since buildSchedule
// finds them by id, not position).
const COURSES = [
  course('carnoustie'),
  course('augusta-national'),
  course('valderrama'),
  course('royal-birkdale'),
  course('tpc-sawgrass'),
  course('marco-simone'),
  course('pebble-beach'),
  course('st-andrews'),
  course('brabazon'),
  course('le-golf-national'),
  course('medinah'),
  course('earth-course'),
  course('pinehurst-no-2'),
  course('whistling-straits'),
  course('royal-melbourne'),
  course('royal-county-down'),
]

describe('buildSchedule', () => {
  it('produces exactly 16 rounds, numbered 1-16', () => {
    const schedule = buildSchedule(COURSES)
    expect(schedule).toHaveLength(16)
    expect(schedule.map((s) => s.roundNumber)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1))
  })

  it('places the 4 majors at rounds 4, 8, 12, and 16, in the expected order', () => {
    const schedule = buildSchedule(COURSES)
    const majorRounds = schedule.filter((s) => s.isMajor)
    expect(majorRounds.map((s) => s.roundNumber)).toEqual([4, 8, 12, 16])
    expect(majorRounds.map((s) => s.courseId)).toEqual(MAJOR_COURSE_IDS)
  })

  it('fills the other 12 rounds with every non-major course exactly once', () => {
    const schedule = buildSchedule(COURSES)
    const regularCourseIds = schedule.filter((s) => !s.isMajor).map((s) => s.courseId)
    const expected = COURSES.map((c) => c.id).filter((id) => !MAJOR_COURSE_IDS.includes(id))
    expect(regularCourseIds).toEqual(expected)
  })

  it('stays correct regardless of the majors position in the input course list', () => {
    const shuffled = [...COURSES].reverse()
    const schedule = buildSchedule(shuffled)
    expect(schedule.filter((s) => s.isMajor).map((s) => s.courseId)).toEqual(MAJOR_COURSE_IDS)
  })
})

describe('createSeason', () => {
  it('assigns sequential season numbers based on the archive length', () => {
    expect(createSeason([], COURSES).seasonNumber).toBe(1)
    const fakeArchive = [{ seasonNumber: 1 } as CompletedSeason, { seasonNumber: 2 } as CompletedSeason]
    expect(createSeason(fakeArchive, COURSES).seasonNumber).toBe(3)
  })

  it('starts with an empty results list and a fresh 16-round schedule', () => {
    const season = createSeason([], COURSES)
    expect(season.results).toEqual([])
    expect(season.schedule).toHaveLength(16)
  })
})

describe('recordSeasonRoundResult / isSeasonComplete', () => {
  function result(roundNumber: number): SeasonRoundResult {
    return {
      roundNumber,
      courseId: 'carnoustie',
      isMajor: false,
      isBogeyFreeRound: false,
      totalStrokesToPar: 0,
      roundRecordId: `record-${roundNumber}`,
    }
  }

  it('appends a result and reports incomplete before all 16 rounds are played', () => {
    let season = createSeason([], COURSES)
    for (let i = 1; i <= 15; i++) {
      season = recordSeasonRoundResult(season, result(i))
    }
    expect(season.results).toHaveLength(15)
    expect(isSeasonComplete(season)).toBe(false)
  })

  it('reports complete once the 16th round is recorded', () => {
    let season = createSeason([], COURSES)
    for (let i = 1; i <= 16; i++) {
      season = recordSeasonRoundResult(season, result(i))
    }
    expect(isSeasonComplete(season)).toBe(true)
  })
})
