import { describe, expect, it } from 'vitest'
import type { Course } from '../../content/types'
import type { RoundRecord } from '../stats/types'
import { deriveAchievements } from './deriveAchievements'

function course(id: string, par: number): Course {
  return { id, name: id, par, holes: [] }
}

function round(courseId: string, overrides: Partial<RoundRecord> = {}): RoundRecord {
  return {
    id: `round-${Math.random()}`,
    playedAt: '2026-01-01T00:00:00.000Z',
    courseId,
    holeResults: [],
    totalStrokesToPar: 0,
    bogeyFreeThroughHole: 18,
    isBogeyFreeRound: false,
    ...overrides,
  }
}

function hole(
  holeNumber: number,
  outcomeTier: RoundRecord['holeResults'][number]['outcomeTier'],
  relativeScore = 0,
  golferId = 'golfer',
): RoundRecord['holeResults'][number] {
  return { holeNumber, golferId, countryId: 'country', outcomeTier, archetypeMatched: true, relativeScore }
}

const COURSES = [course('augusta', 72), course('carnoustie', 71)]

describe('deriveAchievements', () => {
  it('returns every achievement locked when there are no rounds at all', () => {
    const achievements = deriveAchievements([], COURSES)
    expect(achievements.every((a) => !a.isUnlocked)).toBe(true)
    // 2 courses x 2 per-course achievements + 8 career milestones + 4 iconic moments
    expect(achievements).toHaveLength(16)
  })

  it('unlocks a course bogey-free achievement only when a bogey-free round exists at that course', () => {
    const rounds = [round('augusta', { isBogeyFreeRound: true })]
    const achievements = deriveAchievements(rounds, COURSES)
    const augustaBogeyFree = achievements.find((a) => a.id === 'bogey-free-augusta')
    const carnoustieBogeyFree = achievements.find((a) => a.id === 'bogey-free-carnoustie')
    expect(augustaBogeyFree?.isUnlocked).toBe(true)
    expect(carnoustieBogeyFree?.isUnlocked).toBe(false)
  })

  it('a non-bogey-free round at the right course does not unlock it', () => {
    const rounds = [round('augusta', { isBogeyFreeRound: false })]
    const achievements = deriveAchievements(rounds, COURSES)
    expect(achievements.find((a) => a.id === 'bogey-free-augusta')?.isUnlocked).toBe(false)
  })

  it('break 60 is a gross-score threshold, not relative to par', () => {
    // Augusta is par 72: -13 to par = 59 gross, which does break 60.
    const brokeIt = round('augusta', { totalStrokesToPar: -13 })
    // -12 to par = 60 gross exactly, which does NOT break 60 (has to be under).
    const justMissed = round('augusta', { totalStrokesToPar: -12 })

    expect(deriveAchievements([brokeIt], COURSES).find((a) => a.id === 'break-60-augusta')?.isUnlocked).toBe(true)
    expect(deriveAchievements([justMissed], COURSES).find((a) => a.id === 'break-60-augusta')?.isUnlocked).toBe(
      false,
    )
  })

  it('the same gross-score rule lands differently per course because par differs', () => {
    // Carnoustie is par 71: -12 to par = 59 gross, which DOES break 60 (unlike at Augusta above).
    const rounds = [round('carnoustie', { totalStrokesToPar: -12 })]
    expect(deriveAchievements(rounds, COURSES).find((a) => a.id === 'break-60-carnoustie')?.isUnlocked).toBe(
      true,
    )
  })

  it('"everywhere" achievements only unlock once every course has its own achievement unlocked', () => {
    const rounds = [
      round('augusta', { isBogeyFreeRound: true, totalStrokesToPar: -13 }),
      round('carnoustie', { isBogeyFreeRound: false, totalStrokesToPar: 0 }),
    ]
    const achievements = deriveAchievements(rounds, COURSES)
    expect(achievements.find((a) => a.id === 'bogey-free-everywhere')?.isUnlocked).toBe(false)
    expect(achievements.find((a) => a.id === 'break-60-everywhere')?.isUnlocked).toBe(false)

    const allDone = [
      round('augusta', { isBogeyFreeRound: true, totalStrokesToPar: -13 }),
      round('carnoustie', { isBogeyFreeRound: true, totalStrokesToPar: -12 }),
    ]
    const complete = deriveAchievements(allDone, COURSES)
    expect(complete.find((a) => a.id === 'bogey-free-everywhere')?.isUnlocked).toBe(true)
    expect(complete.find((a) => a.id === 'break-60-everywhere')?.isUnlocked).toBe(true)
  })

  it('returns achievements course-grouped in course order, career milestones last', () => {
    const achievements = deriveAchievements([], COURSES)
    expect(achievements.map((a) => a.id)).toEqual([
      'bogey-free-augusta',
      'break-60-augusta',
      'bogey-free-carnoustie',
      'break-60-carnoustie',
      'bogey-free-everywhere',
      'break-60-everywhere',
      'first-hole-in-one',
      'perfect-match',
      'birdie-run',
      'bogey-free-5-rounds',
      'bogey-free-10-rounds',
      'three-peat',
      'ace-island-green',
      'amen-corner-answered',
      'the-impossible-chip',
      'golden-bear',
    ])
  })

  it('tags each achievement with the right section', () => {
    const achievements = deriveAchievements([], COURSES)
    expect(achievements.filter((a) => a.section === 'course')).toHaveLength(4)
    expect(achievements.filter((a) => a.section === 'career')).toHaveLength(8)
    expect(achievements.filter((a) => a.section === 'iconic')).toHaveLength(4)
  })

  it('unlocks "First Hole-in-One" from a hole-in-one on any course', () => {
    const rounds = [round('carnoustie', { holeResults: [hole(5, 'hole_in_one')] })]
    expect(deriveAchievements(rounds, COURSES).find((a) => a.id === 'first-hole-in-one')?.isUnlocked).toBe(true)
  })

  it('does not unlock "First Hole-in-One" when no hole was a hole-in-one', () => {
    const rounds = [round('carnoustie', { holeResults: [hole(5, 'eagle')] })]
    expect(deriveAchievements(rounds, COURSES).find((a) => a.id === 'first-hole-in-one')?.isUnlocked).toBe(false)
  })

  it('unlocks "Ace on the Island Green" only for a hole-in-one on TPC Sawgrass hole 17', () => {
    const rounds = [round('tpc-sawgrass', { holeResults: [hole(17, 'hole_in_one')] })]
    expect(deriveAchievements(rounds, COURSES).find((a) => a.id === 'ace-island-green')?.isUnlocked).toBe(true)
  })

  it('does not unlock "Ace on the Island Green" for a hole-in-one on the wrong hole or course', () => {
    const wrongHole = [round('tpc-sawgrass', { holeResults: [hole(16, 'hole_in_one')] })]
    const wrongCourse = [round('carnoustie', { holeResults: [hole(17, 'hole_in_one')] })]
    expect(deriveAchievements(wrongHole, COURSES).find((a) => a.id === 'ace-island-green')?.isUnlocked).toBe(false)
    expect(deriveAchievements(wrongCourse, COURSES).find((a) => a.id === 'ace-island-green')?.isUnlocked).toBe(
      false,
    )
  })

  it('unlocks "Amen Corner, Answered" when holes 11-13 at Augusta National are under par combined', () => {
    const rounds = [
      round('augusta-national', {
        holeResults: [hole(11, 'par', -1), hole(12, 'par', 0), hole(13, 'par', 0)],
      }),
    ]
    expect(deriveAchievements(rounds, COURSES).find((a) => a.id === 'amen-corner-answered')?.isUnlocked).toBe(true)
  })

  it('does not unlock "Amen Corner, Answered" at exactly even par or on the wrong course', () => {
    const evenPar = [
      round('augusta-national', {
        holeResults: [hole(11, 'par', 0), hole(12, 'par', 0), hole(13, 'par', 0)],
      }),
    ]
    const wrongCourse = [
      round('carnoustie', {
        holeResults: [hole(11, 'par', -1), hole(12, 'par', 0), hole(13, 'par', 0)],
      }),
    ]
    expect(deriveAchievements(evenPar, COURSES).find((a) => a.id === 'amen-corner-answered')?.isUnlocked).toBe(
      false,
    )
    expect(deriveAchievements(wrongCourse, COURSES).find((a) => a.id === 'amen-corner-answered')?.isUnlocked).toBe(
      false,
    )
  })

  it('unlocks "The Impossible Chip" for a birdie by Tiger Woods on Augusta National hole 16', () => {
    const rounds = [
      round('augusta-national', { holeResults: [hole(16, 'birdie', -1, 'usa-woods')] }),
    ]
    expect(deriveAchievements(rounds, COURSES).find((a) => a.id === 'the-impossible-chip')?.isUnlocked).toBe(true)
  })

  it('does not unlock "The Impossible Chip" for the wrong golfer, hole, course, or outcome', () => {
    const wrongGolfer = [round('augusta-national', { holeResults: [hole(16, 'birdie', -1, 'someone-else')] })]
    const wrongHole = [round('augusta-national', { holeResults: [hole(15, 'birdie', -1, 'usa-woods')] })]
    const wrongCourse = [round('carnoustie', { holeResults: [hole(16, 'birdie', -1, 'usa-woods')] })]
    const wrongOutcome = [round('augusta-national', { holeResults: [hole(16, 'eagle', -2, 'usa-woods')] })]

    for (const rounds of [wrongGolfer, wrongHole, wrongCourse, wrongOutcome]) {
      expect(deriveAchievements(rounds, COURSES).find((a) => a.id === 'the-impossible-chip')?.isUnlocked).toBe(
        false,
      )
    }
  })

  it('unlocks "Perfect Match" only when all 18 holes in a round have their archetype matched', () => {
    const allMatched = Array.from({ length: 18 }, (_, i) => hole(i + 1, 'par', 0, 'golfer'))
    const oneUnmatched = allMatched.map((h, i) => (i === 4 ? { ...h, archetypeMatched: false } : h))

    expect(
      deriveAchievements([round('augusta', { holeResults: allMatched })], COURSES).find(
        (a) => a.id === 'perfect-match',
      )?.isUnlocked,
    ).toBe(true)
    expect(
      deriveAchievements([round('augusta', { holeResults: oneUnmatched })], COURSES).find(
        (a) => a.id === 'perfect-match',
      )?.isUnlocked,
    ).toBe(false)
  })

  it('unlocks "Birdie Run" only for 5 consecutive birdies in one round', () => {
    const fiveInARow = [
      hole(1, 'par'),
      hole(2, 'birdie'),
      hole(3, 'birdie'),
      hole(4, 'birdie'),
      hole(5, 'birdie'),
      hole(6, 'birdie'),
      hole(7, 'par'),
    ]
    const onlyFourInARow = [
      hole(1, 'par'),
      hole(2, 'birdie'),
      hole(3, 'birdie'),
      hole(4, 'birdie'),
      hole(5, 'birdie'),
      hole(6, 'par'),
    ]

    expect(
      deriveAchievements([round('augusta', { holeResults: fiveInARow })], COURSES).find(
        (a) => a.id === 'birdie-run',
      )?.isUnlocked,
    ).toBe(true)
    expect(
      deriveAchievements([round('augusta', { holeResults: onlyFourInARow })], COURSES).find(
        (a) => a.id === 'birdie-run',
      )?.isUnlocked,
    ).toBe(false)
  })

  it('unlocks the 5- and 10-round bogey-free milestones only once enough bogey-free rounds have been played', () => {
    const fourBogeyFree = Array.from({ length: 4 }, () => round('augusta', { isBogeyFreeRound: true }))
    const fiveBogeyFree = Array.from({ length: 5 }, () => round('augusta', { isBogeyFreeRound: true }))
    const tenBogeyFree = Array.from({ length: 10 }, () => round('augusta', { isBogeyFreeRound: true }))

    expect(deriveAchievements(fourBogeyFree, COURSES).find((a) => a.id === 'bogey-free-5-rounds')?.isUnlocked).toBe(
      false,
    )
    expect(deriveAchievements(fiveBogeyFree, COURSES).find((a) => a.id === 'bogey-free-5-rounds')?.isUnlocked).toBe(
      true,
    )
    expect(deriveAchievements(fiveBogeyFree, COURSES).find((a) => a.id === 'bogey-free-10-rounds')?.isUnlocked).toBe(
      false,
    )
    expect(deriveAchievements(tenBogeyFree, COURSES).find((a) => a.id === 'bogey-free-10-rounds')?.isUnlocked).toBe(
      true,
    )
  })

  it('unlocks "Golden Bear" only for a bogey-free round at Augusta National with Jack Nicklaus in the bag', () => {
    const rounds = [
      round('augusta-national', { isBogeyFreeRound: true, holeResults: [hole(1, 'par', 0, 'usa-nicklaus')] }),
    ]
    expect(deriveAchievements(rounds, COURSES).find((a) => a.id === 'golden-bear')?.isUnlocked).toBe(true)
  })

  it('does not unlock "Golden Bear" without Nicklaus in the bag, without bogey-free, or on the wrong course', () => {
    const noNicklaus = [
      round('augusta-national', { isBogeyFreeRound: true, holeResults: [hole(1, 'par', 0, 'someone-else')] }),
    ]
    const notBogeyFree = [
      round('augusta-national', { isBogeyFreeRound: false, holeResults: [hole(1, 'par', 0, 'usa-nicklaus')] }),
    ]
    const wrongCourse = [
      round('carnoustie', { isBogeyFreeRound: true, holeResults: [hole(1, 'par', 0, 'usa-nicklaus')] }),
    ]

    for (const rounds of [noNicklaus, notBogeyFree, wrongCourse]) {
      expect(deriveAchievements(rounds, COURSES).find((a) => a.id === 'golden-bear')?.isUnlocked).toBe(false)
    }
  })

  it('unlocks "3-Peat" only for 3 consecutive rounds (by play order) shooting 65 or under gross', () => {
    // Augusta is par 72: -8 to par = 64 gross, which does shoot 65 or under.
    function goodRound(playedAt: string) {
      return round('augusta', { playedAt, totalStrokesToPar: -8 })
    }
    // -6 to par = 66 gross, which does NOT shoot 65 or under.
    function missedRound(playedAt: string) {
      return round('augusta', { playedAt, totalStrokesToPar: -6 })
    }

    const threeInARow = [goodRound('2026-01-01T00:00:00.000Z'), goodRound('2026-01-02T00:00:00.000Z'), goodRound('2026-01-03T00:00:00.000Z')]
    expect(deriveAchievements(threeInARow, COURSES).find((a) => a.id === 'three-peat')?.isUnlocked).toBe(true)

    const brokenStreak = [
      goodRound('2026-01-01T00:00:00.000Z'),
      missedRound('2026-01-02T00:00:00.000Z'),
      goodRound('2026-01-03T00:00:00.000Z'),
      goodRound('2026-01-04T00:00:00.000Z'),
    ]
    expect(deriveAchievements(brokenStreak, COURSES).find((a) => a.id === 'three-peat')?.isUnlocked).toBe(false)

    // Same 3 good rounds, but supplied out of chronological order — the
    // streak should still be found because it sorts by playedAt first.
    const outOfOrder = [goodRound('2026-01-03T00:00:00.000Z'), goodRound('2026-01-01T00:00:00.000Z'), goodRound('2026-01-02T00:00:00.000Z')]
    expect(deriveAchievements(outOfOrder, COURSES).find((a) => a.id === 'three-peat')?.isUnlocked).toBe(true)
  })

  it('does not unlock "3-Peat" for a round on a course with no known par', () => {
    const rounds = [
      round('unknown-course', { playedAt: '2026-01-01T00:00:00.000Z', totalStrokesToPar: -8 }),
      round('unknown-course', { playedAt: '2026-01-02T00:00:00.000Z', totalStrokesToPar: -8 }),
      round('unknown-course', { playedAt: '2026-01-03T00:00:00.000Z', totalStrokesToPar: -8 }),
    ]
    expect(deriveAchievements(rounds, COURSES).find((a) => a.id === 'three-peat')?.isUnlocked).toBe(false)
  })
})
