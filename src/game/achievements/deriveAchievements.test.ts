import { describe, expect, it } from 'vitest'
import type { Country, CountriesContent, Course, Golfer } from '../../content/types'
import type { RoundRecord } from '../stats/types'
import { deriveAchievements } from './deriveAchievements'

function course(id: string, par: number): Course {
  return { id, name: id, par, holes: [] }
}

function golfer(id: string, overrides: Partial<Golfer> = {}): Golfer {
  return { id, name: id, archetypes: ['closer'], ...overrides }
}

function country(id: string, golfers: Golfer[]): Country {
  return { id, name: id, isoCode: 'US', golfers }
}

// Named to match the real ids used elsewhere in this file (usa-nicklaus,
// usa-woods, and the rest of the Grand Slam roster) plus a couple of
// purpose-built golfers for the mismatch/legend tests, so every test can
// share one fixture instead of building its own.
const COUNTRIES: CountriesContent = {
  version: 1,
  countries: [
    country('usa', [
      golfer('usa-nicklaus', { name: 'Jack Nicklaus', skill: 'legend' }),
      golfer('usa-woods', { name: 'Tiger Woods', skill: 'legend' }),
      golfer('usa-hogan', { name: 'Ben Hogan', skill: 'legend' }),
      golfer('usa-sarazen', { name: 'Gene Sarazen', skill: 'legend' }),
      golfer('scrambler-golfer', { archetypes: ['scrambler'] }),
      golfer('long-hitter-golfer', { archetypes: ['long_hitter'] }),
      golfer('golfer', { archetypes: ['closer'] }),
    ]),
    country('rsa', [golfer('rsa-player', { name: 'Gary Player', skill: 'legend' })]),
    country('nir', [golfer('nir-mcilroy', { name: 'Rory McIlroy', skill: 'legend' })]),
  ],
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
    const achievements = deriveAchievements([], COURSES, COUNTRIES)
    expect(achievements.every((a) => !a.isUnlocked)).toBe(true)
    // 2 courses x 2 per-course achievements + 13 career milestones + 8 iconic moments
    expect(achievements).toHaveLength(25)
  })

  it('unlocks a course bogey-free achievement only when a bogey-free round exists at that course', () => {
    const rounds = [round('augusta', { isBogeyFreeRound: true })]
    const achievements = deriveAchievements(rounds, COURSES, COUNTRIES)
    const augustaBogeyFree = achievements.find((a) => a.id === 'bogey-free-augusta')
    const carnoustieBogeyFree = achievements.find((a) => a.id === 'bogey-free-carnoustie')
    expect(augustaBogeyFree?.isUnlocked).toBe(true)
    expect(carnoustieBogeyFree?.isUnlocked).toBe(false)
  })

  it('a non-bogey-free round at the right course does not unlock it', () => {
    const rounds = [round('augusta', { isBogeyFreeRound: false })]
    const achievements = deriveAchievements(rounds, COURSES, COUNTRIES)
    expect(achievements.find((a) => a.id === 'bogey-free-augusta')?.isUnlocked).toBe(false)
  })

  it('break 60 is a gross-score threshold, not relative to par', () => {
    // Augusta is par 72: -13 to par = 59 gross, which does break 60.
    const brokeIt = round('augusta', { totalStrokesToPar: -13 })
    // -12 to par = 60 gross exactly, which does NOT break 60 (has to be under).
    const justMissed = round('augusta', { totalStrokesToPar: -12 })

    expect(deriveAchievements([brokeIt], COURSES, COUNTRIES).find((a) => a.id === 'break-60-augusta')?.isUnlocked).toBe(true)
    expect(deriveAchievements([justMissed], COURSES, COUNTRIES).find((a) => a.id === 'break-60-augusta')?.isUnlocked).toBe(
      false,
    )
  })

  it('the same gross-score rule lands differently per course because par differs', () => {
    // Carnoustie is par 71: -12 to par = 59 gross, which DOES break 60 (unlike at Augusta above).
    const rounds = [round('carnoustie', { totalStrokesToPar: -12 })]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'break-60-carnoustie')?.isUnlocked).toBe(
      true,
    )
  })

  it('"everywhere" achievements only unlock once every course has its own achievement unlocked', () => {
    const rounds = [
      round('augusta', { isBogeyFreeRound: true, totalStrokesToPar: -13 }),
      round('carnoustie', { isBogeyFreeRound: false, totalStrokesToPar: 0 }),
    ]
    const achievements = deriveAchievements(rounds, COURSES, COUNTRIES)
    expect(achievements.find((a) => a.id === 'bogey-free-everywhere')?.isUnlocked).toBe(false)
    expect(achievements.find((a) => a.id === 'break-60-everywhere')?.isUnlocked).toBe(false)

    const allDone = [
      round('augusta', { isBogeyFreeRound: true, totalStrokesToPar: -13 }),
      round('carnoustie', { isBogeyFreeRound: true, totalStrokesToPar: -12 }),
    ]
    const complete = deriveAchievements(allDone, COURSES, COUNTRIES)
    expect(complete.find((a) => a.id === 'bogey-free-everywhere')?.isUnlocked).toBe(true)
    expect(complete.find((a) => a.id === 'break-60-everywhere')?.isUnlocked).toBe(true)
  })

  it('returns achievements course-grouped in course order, career milestones last', () => {
    const achievements = deriveAchievements([], COURSES, COUNTRIES)
    expect(achievements.map((a) => a.id)).toEqual([
      'bogey-free-augusta',
      'break-60-augusta',
      'bogey-free-carnoustie',
      'break-60-carnoustie',
      'bogey-free-everywhere',
      'bogey-free-5-rounds',
      'bogey-free-10-rounds',
      'break-60-everywhere',
      'three-peat',
      'first-hole-in-one',
      'birdie-run',
      'perfect-match',
      'peoples-champion',
      'legendary-stuff',
      'take-mine-scrambled',
      'bombs-away',
      'grand-slam',
      'ace-island-green',
      'amen-corner-answered',
      'the-impossible-chip',
      'golden-bear',
      'postcard-perfect',
      'jimenez-escape',
      'miracle-at-medinah',
      'kiwi-closer',
    ])
  })

  it('tags each achievement with the right section', () => {
    const achievements = deriveAchievements([], COURSES, COUNTRIES)
    expect(achievements.filter((a) => a.section === 'course')).toHaveLength(4)
    expect(achievements.filter((a) => a.section === 'career')).toHaveLength(13)
    expect(achievements.filter((a) => a.section === 'iconic')).toHaveLength(8)
  })

  it('unlocks "First Hole-in-One" from a hole-in-one on any course', () => {
    const rounds = [round('carnoustie', { holeResults: [hole(5, 'hole_in_one')] })]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'first-hole-in-one')?.isUnlocked).toBe(true)
  })

  it('does not unlock "First Hole-in-One" when no hole was a hole-in-one', () => {
    const rounds = [round('carnoustie', { holeResults: [hole(5, 'eagle')] })]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'first-hole-in-one')?.isUnlocked).toBe(false)
  })

  it('unlocks "Ace on the Island Green" only for a hole-in-one on TPC Sawgrass hole 17', () => {
    const rounds = [round('tpc-sawgrass', { holeResults: [hole(17, 'hole_in_one')] })]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'ace-island-green')?.isUnlocked).toBe(true)
  })

  it('does not unlock "Ace on the Island Green" for a hole-in-one on the wrong hole or course', () => {
    const wrongHole = [round('tpc-sawgrass', { holeResults: [hole(16, 'hole_in_one')] })]
    const wrongCourse = [round('carnoustie', { holeResults: [hole(17, 'hole_in_one')] })]
    expect(deriveAchievements(wrongHole, COURSES, COUNTRIES).find((a) => a.id === 'ace-island-green')?.isUnlocked).toBe(false)
    expect(deriveAchievements(wrongCourse, COURSES, COUNTRIES).find((a) => a.id === 'ace-island-green')?.isUnlocked).toBe(
      false,
    )
  })

  it('unlocks "Amen Corner, Answered" when holes 11-13 at Augusta National are under par combined', () => {
    const rounds = [
      round('augusta-national', {
        holeResults: [hole(11, 'par', -1), hole(12, 'par', 0), hole(13, 'par', 0)],
      }),
    ]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'amen-corner-answered')?.isUnlocked).toBe(true)
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
    expect(deriveAchievements(evenPar, COURSES, COUNTRIES).find((a) => a.id === 'amen-corner-answered')?.isUnlocked).toBe(
      false,
    )
    expect(deriveAchievements(wrongCourse, COURSES, COUNTRIES).find((a) => a.id === 'amen-corner-answered')?.isUnlocked).toBe(
      false,
    )
  })

  it('unlocks "The Impossible Chip" for a birdie by Tiger Woods on Augusta National hole 16', () => {
    const rounds = [
      round('augusta-national', { holeResults: [hole(16, 'birdie', -1, 'usa-woods')] }),
    ]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'the-impossible-chip')?.isUnlocked).toBe(true)
  })

  it('does not unlock "The Impossible Chip" for the wrong golfer, hole, course, or outcome', () => {
    const wrongGolfer = [round('augusta-national', { holeResults: [hole(16, 'birdie', -1, 'someone-else')] })]
    const wrongHole = [round('augusta-national', { holeResults: [hole(15, 'birdie', -1, 'usa-woods')] })]
    const wrongCourse = [round('carnoustie', { holeResults: [hole(16, 'birdie', -1, 'usa-woods')] })]
    const wrongOutcome = [round('augusta-national', { holeResults: [hole(16, 'eagle', -2, 'usa-woods')] })]

    for (const rounds of [wrongGolfer, wrongHole, wrongCourse, wrongOutcome]) {
      expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'the-impossible-chip')?.isUnlocked).toBe(
        false,
      )
    }
  })

  it('unlocks "Perfect Match" only when all 18 holes in a round have their archetype matched', () => {
    const allMatched = Array.from({ length: 18 }, (_, i) => hole(i + 1, 'par', 0, 'golfer'))
    const oneUnmatched = allMatched.map((h, i) => (i === 4 ? { ...h, archetypeMatched: false } : h))

    expect(
      deriveAchievements([round('augusta', { holeResults: allMatched })], COURSES, COUNTRIES).find(
        (a) => a.id === 'perfect-match',
      )?.isUnlocked,
    ).toBe(true)
    expect(
      deriveAchievements([round('augusta', { holeResults: oneUnmatched })], COURSES, COUNTRIES).find(
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
      deriveAchievements([round('augusta', { holeResults: fiveInARow })], COURSES, COUNTRIES).find(
        (a) => a.id === 'birdie-run',
      )?.isUnlocked,
    ).toBe(true)
    expect(
      deriveAchievements([round('augusta', { holeResults: onlyFourInARow })], COURSES, COUNTRIES).find(
        (a) => a.id === 'birdie-run',
      )?.isUnlocked,
    ).toBe(false)
  })

  it('unlocks the 5- and 10-round bogey-free milestones only once enough bogey-free rounds have been played', () => {
    const fourBogeyFree = Array.from({ length: 4 }, () => round('augusta', { isBogeyFreeRound: true }))
    const fiveBogeyFree = Array.from({ length: 5 }, () => round('augusta', { isBogeyFreeRound: true }))
    const tenBogeyFree = Array.from({ length: 10 }, () => round('augusta', { isBogeyFreeRound: true }))

    expect(deriveAchievements(fourBogeyFree, COURSES, COUNTRIES).find((a) => a.id === 'bogey-free-5-rounds')?.isUnlocked).toBe(
      false,
    )
    expect(deriveAchievements(fiveBogeyFree, COURSES, COUNTRIES).find((a) => a.id === 'bogey-free-5-rounds')?.isUnlocked).toBe(
      true,
    )
    expect(deriveAchievements(fiveBogeyFree, COURSES, COUNTRIES).find((a) => a.id === 'bogey-free-10-rounds')?.isUnlocked).toBe(
      false,
    )
    expect(deriveAchievements(tenBogeyFree, COURSES, COUNTRIES).find((a) => a.id === 'bogey-free-10-rounds')?.isUnlocked).toBe(
      true,
    )
  })

  it('unlocks "Golden Bear" only for a bogey-free round at Augusta National with Jack Nicklaus in the bag', () => {
    const rounds = [
      round('augusta-national', { isBogeyFreeRound: true, holeResults: [hole(1, 'par', 0, 'usa-nicklaus')] }),
    ]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'golden-bear')?.isUnlocked).toBe(true)
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
      expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'golden-bear')?.isUnlocked).toBe(false)
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
    expect(deriveAchievements(threeInARow, COURSES, COUNTRIES).find((a) => a.id === 'three-peat')?.isUnlocked).toBe(true)

    const brokenStreak = [
      goodRound('2026-01-01T00:00:00.000Z'),
      missedRound('2026-01-02T00:00:00.000Z'),
      goodRound('2026-01-03T00:00:00.000Z'),
      goodRound('2026-01-04T00:00:00.000Z'),
    ]
    expect(deriveAchievements(brokenStreak, COURSES, COUNTRIES).find((a) => a.id === 'three-peat')?.isUnlocked).toBe(false)

    // Same 3 good rounds, but supplied out of chronological order — the
    // streak should still be found because it sorts by playedAt first.
    const outOfOrder = [goodRound('2026-01-03T00:00:00.000Z'), goodRound('2026-01-01T00:00:00.000Z'), goodRound('2026-01-02T00:00:00.000Z')]
    expect(deriveAchievements(outOfOrder, COURSES, COUNTRIES).find((a) => a.id === 'three-peat')?.isUnlocked).toBe(true)
  })

  it('does not unlock "3-Peat" for a round on a course with no known par', () => {
    const rounds = [
      round('unknown-course', { playedAt: '2026-01-01T00:00:00.000Z', totalStrokesToPar: -8 }),
      round('unknown-course', { playedAt: '2026-01-02T00:00:00.000Z', totalStrokesToPar: -8 }),
      round('unknown-course', { playedAt: '2026-01-03T00:00:00.000Z', totalStrokesToPar: -8 }),
    ]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'three-peat')?.isUnlocked).toBe(false)
  })

  it('unlocks "The People\'s Champion" only for a bogey-free round with no legend in the bag', () => {
    const noLegends = [
      round('augusta', {
        isBogeyFreeRound: true,
        holeResults: [hole(1, 'par', 0, 'scrambler-golfer'), hole(2, 'par', 0, 'long-hitter-golfer')],
      }),
    ]
    const withALegend = [
      round('augusta', {
        isBogeyFreeRound: true,
        holeResults: [hole(1, 'par', 0, 'usa-nicklaus'), hole(2, 'par', 0, 'long-hitter-golfer')],
      }),
    ]
    const notBogeyFree = [
      round('augusta', {
        isBogeyFreeRound: false,
        holeResults: [hole(1, 'par', 0, 'scrambler-golfer')],
      }),
    ]

    expect(
      deriveAchievements(noLegends, COURSES, COUNTRIES).find((a) => a.id === 'peoples-champion')?.isUnlocked,
    ).toBe(true)
    expect(
      deriveAchievements(withALegend, COURSES, COUNTRIES).find((a) => a.id === 'peoples-champion')?.isUnlocked,
    ).toBe(false)
    expect(
      deriveAchievements(notBogeyFree, COURSES, COUNTRIES).find((a) => a.id === 'peoples-champion')?.isUnlocked,
    ).toBe(false)
  })

  it('unlocks "Legendary Stuff" once legend-earned points reach 1,000, and reports progress toward it', () => {
    // TIER_POINTS: birdie = 2. 500 legend birdies = 1000 points exactly.
    const legendBirdies = Array.from({ length: 500 }, () => hole(1, 'birdie', 0, 'usa-nicklaus'))
    const shortOfIt = legendBirdies.slice(0, 499)

    const complete = deriveAchievements(
      [round('augusta', { holeResults: legendBirdies })],
      COURSES,
      COUNTRIES,
    ).find((a) => a.id === 'legendary-stuff')
    const incomplete = deriveAchievements(
      [round('augusta', { holeResults: shortOfIt })],
      COURSES,
      COUNTRIES,
    ).find((a) => a.id === 'legendary-stuff')

    expect(complete?.isUnlocked).toBe(true)
    expect(complete?.progress).toEqual({ current: 1000, target: 1000 })
    expect(incomplete?.isUnlocked).toBe(false)
    expect(incomplete?.progress).toEqual({ current: 998, target: 1000 })
  })

  it('ignores non-legend points and floors "Legendary Stuff" progress at 0', () => {
    const nonLegendBirdies = [hole(1, 'birdie', 0, 'scrambler-golfer')]
    const legendBogeys = [hole(1, 'bogey_plus', 0, 'usa-nicklaus'), hole(2, 'bogey_plus', 0, 'usa-nicklaus')]

    const nonLegend = deriveAchievements(
      [round('augusta', { holeResults: nonLegendBirdies })],
      COURSES,
      COUNTRIES,
    ).find((a) => a.id === 'legendary-stuff')
    const negative = deriveAchievements(
      [round('augusta', { holeResults: legendBogeys })],
      COURSES,
      COUNTRIES,
    ).find((a) => a.id === 'legendary-stuff')

    expect(nonLegend?.progress).toEqual({ current: 0, target: 1000 })
    expect(negative?.progress).toEqual({ current: 0, target: 1000 })
  })

  it('unlocks the mismatch achievements only for a birdie by the right golfer archetype on the right hole archetype', () => {
    const mismatchCourse: Course = {
      id: 'mismatch-course',
      name: 'mismatch-course',
      par: 72,
      holes: [
        { number: 1, par: 5, yardage: 550, archetype: 'long_hitter' },
        { number: 2, par: 4, yardage: 400, archetype: 'scrambler' },
      ],
    }
    const courses = [...COURSES, mismatchCourse]

    const scramblerOnLongHitterHole = [
      round('mismatch-course', { holeResults: [hole(1, 'birdie', -1, 'scrambler-golfer')] }),
    ]
    const longHitterOnScramblerHole = [
      round('mismatch-course', { holeResults: [hole(2, 'birdie', -1, 'long-hitter-golfer')] }),
    ]
    // Wrong pairing for either achievement: a scrambler birdies a scrambler hole.
    const noMismatch = [round('mismatch-course', { holeResults: [hole(2, 'birdie', -1, 'scrambler-golfer')] })]

    expect(
      deriveAchievements(scramblerOnLongHitterHole, courses, COUNTRIES).find((a) => a.id === 'take-mine-scrambled')
        ?.isUnlocked,
    ).toBe(true)
    expect(
      deriveAchievements(longHitterOnScramblerHole, courses, COUNTRIES).find((a) => a.id === 'bombs-away')
        ?.isUnlocked,
    ).toBe(true)
    expect(
      deriveAchievements(noMismatch, courses, COUNTRIES).find((a) => a.id === 'take-mine-scrambled')?.isUnlocked,
    ).toBe(false)
    expect(
      deriveAchievements(noMismatch, courses, COUNTRIES).find((a) => a.id === 'bombs-away')?.isUnlocked,
    ).toBe(false)
    // Same golfer/hole pairing, but not a birdie — should not unlock either.
    const notABirdie = [round('mismatch-course', { holeResults: [hole(1, 'par', 0, 'scrambler-golfer')] })]
    expect(
      deriveAchievements(notABirdie, courses, COUNTRIES).find((a) => a.id === 'take-mine-scrambled')?.isUnlocked,
    ).toBe(false)
  })

  it('unlocks "Postcard Perfect" only for a hole-in-one on Pebble Beach hole 7', () => {
    const rounds = [round('pebble-beach', { holeResults: [hole(7, 'hole_in_one')] })]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'postcard-perfect')?.isUnlocked).toBe(
      true,
    )
  })

  it('does not unlock "Postcard Perfect" for a hole-in-one on the wrong hole or course', () => {
    const wrongHole = [round('pebble-beach', { holeResults: [hole(8, 'hole_in_one')] })]
    const wrongCourse = [round('augusta', { holeResults: [hole(7, 'hole_in_one')] })]
    expect(
      deriveAchievements(wrongHole, COURSES, COUNTRIES).find((a) => a.id === 'postcard-perfect')?.isUnlocked,
    ).toBe(false)
    expect(
      deriveAchievements(wrongCourse, COURSES, COUNTRIES).find((a) => a.id === 'postcard-perfect')?.isUnlocked,
    ).toBe(false)
  })

  it('unlocks "Jimenez\'s Escape" for a par-or-better on the Road Hole at St Andrews by Jimenez', () => {
    const rounds = [round('st-andrews', { holeResults: [hole(17, 'par', 0, 'esp-jimenez')] })]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'jimenez-escape')?.isUnlocked).toBe(
      true,
    )
  })

  it('does not unlock "Jimenez\'s Escape" for a bogey, the wrong golfer, or the wrong course', () => {
    const bogeyed = [round('st-andrews', { holeResults: [hole(17, 'bogey_plus', 1, 'esp-jimenez')] })]
    const wrongGolfer = [round('st-andrews', { holeResults: [hole(17, 'par', 0, 'someone-else')] })]
    const wrongCourse = [round('augusta', { holeResults: [hole(17, 'par', 0, 'esp-jimenez')] })]
    for (const rounds of [bogeyed, wrongGolfer, wrongCourse]) {
      expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'jimenez-escape')?.isUnlocked).toBe(
        false,
      )
    }
  })

  it('unlocks "Miracle at Medinah" for a birdie by Ian Poulter on Medinah hole 18', () => {
    const rounds = [round('medinah', { holeResults: [hole(18, 'birdie', -1, 'eng-poulter')] })]
    expect(
      deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'miracle-at-medinah')?.isUnlocked,
    ).toBe(true)
  })

  it('does not unlock "Miracle at Medinah" for the wrong golfer, hole, course, or outcome', () => {
    const wrongGolfer = [round('medinah', { holeResults: [hole(18, 'birdie', -1, 'someone-else')] })]
    const wrongHole = [round('medinah', { holeResults: [hole(17, 'birdie', -1, 'eng-poulter')] })]
    const wrongCourse = [round('augusta', { holeResults: [hole(18, 'birdie', -1, 'eng-poulter')] })]
    const wrongOutcome = [round('medinah', { holeResults: [hole(18, 'par', 0, 'eng-poulter')] })]
    for (const rounds of [wrongGolfer, wrongHole, wrongCourse, wrongOutcome]) {
      expect(
        deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'miracle-at-medinah')?.isUnlocked,
      ).toBe(false)
    }
  })

  it('unlocks "Kiwi Closer" for a birdie by Ryan Fox on Royal Birkdale hole 18', () => {
    const rounds = [round('royal-birkdale', { holeResults: [hole(18, 'birdie', -1, 'nzl-fox')] })]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'kiwi-closer')?.isUnlocked).toBe(
      true,
    )
  })

  it('does not unlock "Kiwi Closer" for the wrong golfer, hole, course, or outcome', () => {
    const wrongGolfer = [round('royal-birkdale', { holeResults: [hole(18, 'birdie', -1, 'someone-else')] })]
    const wrongHole = [round('royal-birkdale', { holeResults: [hole(17, 'birdie', -1, 'nzl-fox')] })]
    const wrongCourse = [round('augusta', { holeResults: [hole(18, 'birdie', -1, 'nzl-fox')] })]
    const wrongOutcome = [round('royal-birkdale', { holeResults: [hole(18, 'par', 0, 'nzl-fox')] })]
    for (const rounds of [wrongGolfer, wrongHole, wrongCourse, wrongOutcome]) {
      expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'kiwi-closer')?.isUnlocked).toBe(
        false,
      )
    }
  })

  it('unlocks "The Grand Slam" only once all six golfers have 5 birdies each, and reports progress toward it', () => {
    const grandSlamIds = ['usa-nicklaus', 'rsa-player', 'usa-woods', 'nir-mcilroy', 'usa-hogan', 'usa-sarazen']

    function birdiesFor(golferId: string, count: number) {
      return Array.from({ length: count }, (_, i) => hole(i + 1, 'birdie', -1, golferId))
    }

    const fiveGolfersDone = [
      round('augusta', {
        holeResults: grandSlamIds.slice(0, 5).flatMap((id) => birdiesFor(id, 5)),
      }),
    ]
    const incomplete = deriveAchievements(fiveGolfersDone, COURSES, COUNTRIES).find((a) => a.id === 'grand-slam')
    expect(incomplete?.isUnlocked).toBe(false)
    expect(incomplete?.progress).toEqual({ current: 5, target: 6 })
    // Sarazen (the 6th id) is the one left out of fiveGolfersDone, so his
    // roster entry should be the only one not yet achieved.
    expect(incomplete?.roster).toEqual([
      { name: 'Jack Nicklaus', achieved: true },
      { name: 'Gary Player', achieved: true },
      { name: 'Tiger Woods', achieved: true },
      { name: 'Rory McIlroy', achieved: true },
      { name: 'Ben Hogan', achieved: true },
      { name: 'Gene Sarazen', achieved: false },
    ])

    const allSixDone = [
      round('augusta', { holeResults: grandSlamIds.flatMap((id) => birdiesFor(id, 5)) }),
    ]
    const complete = deriveAchievements(allSixDone, COURSES, COUNTRIES).find((a) => a.id === 'grand-slam')
    expect(complete?.isUnlocked).toBe(true)
    expect(complete?.progress).toEqual({ current: 6, target: 6 })
    expect(complete?.roster?.every((entry) => entry.achieved)).toBe(true)
  })

  it('does not count a golfer toward "The Grand Slam" until they individually reach 5 birdies', () => {
    const grandSlamIds = ['usa-nicklaus', 'rsa-player', 'usa-woods', 'nir-mcilroy', 'usa-hogan', 'usa-sarazen']
    function birdiesFor(golferId: string, count: number) {
      return Array.from({ length: count }, (_, i) => hole(i + 1, 'birdie', -1, golferId))
    }
    // 5 golfers at 5 birdies, the 6th at only 4 — not enough for that golfer.
    const oneShort = [
      round('augusta', {
        holeResults: [...grandSlamIds.slice(0, 5).flatMap((id) => birdiesFor(id, 5)), ...birdiesFor('usa-sarazen', 4)],
      }),
    ]
    const result = deriveAchievements(oneShort, COURSES, COUNTRIES).find((a) => a.id === 'grand-slam')
    expect(result?.isUnlocked).toBe(false)
    expect(result?.progress).toEqual({ current: 5, target: 6 })
  })
})
