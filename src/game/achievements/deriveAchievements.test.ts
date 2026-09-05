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
  countryId = 'country',
): RoundRecord['holeResults'][number] {
  return { holeNumber, golferId, countryId, outcomeTier, archetypeMatched: true, relativeScore }
}

const COURSES = [course('augusta', 72), course('carnoustie', 71)]

describe('deriveAchievements', () => {
  it('returns every achievement locked when there are no rounds at all', () => {
    const achievements = deriveAchievements([], COURSES, COUNTRIES)
    expect(achievements.every((a) => !a.isUnlocked)).toBe(true)
    // 2 courses x 3 per-course achievements + 18 career (14 original + Full House
    // + 3 country Sweeps) + 18 iconic moments + 5 season achievements
    expect(achievements).toHaveLength(47)
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

  it('unlocks "Birdie All Holes" only once every hole at that course has been birdied-or-better at least once', () => {
    const threeHoleCourse: Course = {
      id: 'three-hole-course',
      name: 'three-hole-course',
      par: 12,
      holes: [
        { number: 1, par: 4, yardage: 400, archetype: 'closer' },
        { number: 2, par: 4, yardage: 400, archetype: 'closer' },
        { number: 3, par: 4, yardage: 400, archetype: 'closer' },
      ],
    }
    const courses = [...COURSES, threeHoleCourse]

    const partial = [round('three-hole-course', { holeResults: [hole(1, 'birdie'), hole(2, 'birdie')] })]
    const partialResult = deriveAchievements(partial, courses, COUNTRIES).find((a) => a.id === 'birdie-all-three-hole-course')
    expect(partialResult?.isUnlocked).toBe(false)
    expect(partialResult?.holeProgress).toEqual([
      { holeNumber: 1, achieved: true },
      { holeNumber: 2, achieved: true },
      { holeNumber: 3, achieved: false },
    ])

    // All three holes covered, but across two different rounds rather than
    // one — cumulative across round history, same as bogey-free-5-rounds.
    const complete = [
      round('three-hole-course', { holeResults: [hole(1, 'birdie'), hole(2, 'par')] }),
      round('three-hole-course', { holeResults: [hole(2, 'eagle'), hole(3, 'hole_in_one')] }),
    ]
    const completeResult = deriveAchievements(complete, courses, COUNTRIES).find(
      (a) => a.id === 'birdie-all-three-hole-course',
    )
    expect(completeResult?.isUnlocked).toBe(true)
    expect(completeResult?.holeProgress?.every((h) => h.achieved)).toBe(true)
  })

  it('does not unlock "Birdie All Holes" for a course with no hole data', () => {
    // COURSES' fixture courses have an empty holes array — every() is
    // vacuously true on an empty array, so this guards against that trap.
    const rounds = [round('augusta', { holeResults: [hole(1, 'birdie')] })]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'birdie-all-augusta')?.isUnlocked).toBe(
      false,
    )
  })

  it('"Birdie All Holes" only counts birdie, eagle, or hole-in-one — not par or bogey', () => {
    const threeHoleCourse: Course = {
      id: 'three-hole-course',
      name: 'three-hole-course',
      par: 12,
      holes: [
        { number: 1, par: 4, yardage: 400, archetype: 'closer' },
        { number: 2, par: 4, yardage: 400, archetype: 'closer' },
        { number: 3, par: 4, yardage: 400, archetype: 'closer' },
      ],
    }
    const courses = [...COURSES, threeHoleCourse]
    const rounds = [round('three-hole-course', { holeResults: [hole(1, 'par'), hole(2, 'bogey_plus')] })]
    const result = deriveAchievements(rounds, courses, COUNTRIES).find((a) => a.id === 'birdie-all-three-hole-course')
    expect(result?.holeProgress).toEqual([
      { holeNumber: 1, achieved: false },
      { holeNumber: 2, achieved: false },
      { holeNumber: 3, achieved: false },
    ])
  })

  it('returns achievements course-grouped in course order, career milestones last', () => {
    const achievements = deriveAchievements([], COURSES, COUNTRIES)
    expect(achievements.map((a) => a.id)).toEqual([
      'bogey-free-augusta',
      'break-60-augusta',
      'birdie-all-augusta',
      'bogey-free-carnoustie',
      'break-60-carnoustie',
      'birdie-all-carnoustie',
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
      'an-off-day',
      'take-mine-scrambled',
      'bombs-away',
      'grand-slam',
      'full-house',
      'birdie-country-usa',
      'birdie-country-rsa',
      'birdie-country-nir',
      'first-season',
      'first-major',
      'major-slam',
      'back-to-back',
      'all-star-season',
      'the-impossible-chip',
      'amen-corner-answered',
      'golden-bear',
      'pebble-beach-runaway',
      'ace-island-green',
      'postcard-perfect',
      'miracle-at-medinah',
      'cup-clincher',
      'scheffler-gold',
      'faldos-redemption',
      'lawrie-comeback',
      'stenson-finale',
      'seves-home-course',
      'kiwi-closer',
      'jimenez-escape',
      'garcia-home-soil',
      'spirit-of-seve',
      'harringtons-survival',
    ])
  })

  it('tags each achievement with the right section', () => {
    const achievements = deriveAchievements([], COURSES, COUNTRIES)
    expect(achievements.filter((a) => a.section === 'course')).toHaveLength(6)
    // 14 original milestones + Full House + 3 country Sweeps (one per fixture country)
    expect(achievements.filter((a) => a.section === 'career')).toHaveLength(18)
    expect(achievements.filter((a) => a.section === 'iconic')).toHaveLength(18)
    expect(achievements.filter((a) => a.section === 'season')).toHaveLength(5)
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

  it('unlocks "Tiger\'s Pebble Beach Runaway" only for -12 or better at Pebble Beach with Tiger Woods in the bag', () => {
    const good = [round('pebble-beach', { totalStrokesToPar: -12, holeResults: [hole(1, 'par', 0, 'usa-woods')] })]
    expect(
      deriveAchievements(good, COURSES, COUNTRIES).find((a) => a.id === 'pebble-beach-runaway')?.isUnlocked,
    ).toBe(true)

    const worse = [round('pebble-beach', { totalStrokesToPar: -11, holeResults: [hole(1, 'par', 0, 'usa-woods')] })]
    expect(
      deriveAchievements(worse, COURSES, COUNTRIES).find((a) => a.id === 'pebble-beach-runaway')?.isUnlocked,
    ).toBe(false)

    const noTiger = [round('pebble-beach', { totalStrokesToPar: -12, holeResults: [hole(1, 'par', 0, 'someone-else')] })]
    expect(
      deriveAchievements(noTiger, COURSES, COUNTRIES).find((a) => a.id === 'pebble-beach-runaway')?.isUnlocked,
    ).toBe(false)
  })

  it('unlocks "Faldo\'s Redemption" only for -5 or better at Augusta National with Nick Faldo in the bag', () => {
    const good = [round('augusta-national', { totalStrokesToPar: -5, holeResults: [hole(1, 'par', 0, 'eng-faldo')] })]
    expect(
      deriveAchievements(good, COURSES, COUNTRIES).find((a) => a.id === 'faldos-redemption')?.isUnlocked,
    ).toBe(true)

    const worse = [round('augusta-national', { totalStrokesToPar: -4, holeResults: [hole(1, 'par', 0, 'eng-faldo')] })]
    expect(
      deriveAchievements(worse, COURSES, COUNTRIES).find((a) => a.id === 'faldos-redemption')?.isUnlocked,
    ).toBe(false)
  })

  it('unlocks "Seve\'s Home Course" only for a bogey-free round at Valderrama with Seve Ballesteros in the bag', () => {
    const rounds = [
      round('valderrama', { isBogeyFreeRound: true, holeResults: [hole(1, 'par', 0, 'esp-ballesteros')] }),
    ]
    expect(
      deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'seves-home-course')?.isUnlocked,
    ).toBe(true)

    const notBogeyFree = [
      round('valderrama', { isBogeyFreeRound: false, holeResults: [hole(1, 'par', 0, 'esp-ballesteros')] }),
    ]
    const noSeve = [round('valderrama', { isBogeyFreeRound: true, holeResults: [hole(1, 'par', 0, 'someone-else')] })]
    for (const bad of [notBogeyFree, noSeve]) {
      expect(deriveAchievements(bad, COURSES, COUNTRIES).find((a) => a.id === 'seves-home-course')?.isUnlocked).toBe(
        false,
      )
    }
  })

  it('unlocks "Harrington\'s Survival" only for +3 or WORSE at Royal Birkdale with Padraig Harrington in the bag', () => {
    // The inverse of every other score achievement — a good round (better
    // than +3) must NOT unlock this one.
    const exactlyThree = [
      round('royal-birkdale', { totalStrokesToPar: 3, holeResults: [hole(1, 'par', 0, 'irl-harrington')] }),
    ]
    expect(
      deriveAchievements(exactlyThree, COURSES, COUNTRIES).find((a) => a.id === 'harringtons-survival')?.isUnlocked,
    ).toBe(true)

    const worse = [
      round('royal-birkdale', { totalStrokesToPar: 8, holeResults: [hole(1, 'par', 0, 'irl-harrington')] }),
    ]
    expect(
      deriveAchievements(worse, COURSES, COUNTRIES).find((a) => a.id === 'harringtons-survival')?.isUnlocked,
    ).toBe(true)

    const tooGood = [
      round('royal-birkdale', { totalStrokesToPar: 2, holeResults: [hole(1, 'par', 0, 'irl-harrington')] }),
    ]
    expect(
      deriveAchievements(tooGood, COURSES, COUNTRIES).find((a) => a.id === 'harringtons-survival')?.isUnlocked,
    ).toBe(false)

    const evenBetter = [
      round('royal-birkdale', { totalStrokesToPar: -4, holeResults: [hole(1, 'par', 0, 'irl-harrington')] }),
    ]
    expect(
      deriveAchievements(evenBetter, COURSES, COUNTRIES).find((a) => a.id === 'harringtons-survival')?.isUnlocked,
    ).toBe(false)

    const noHarrington = [
      round('royal-birkdale', { totalStrokesToPar: 3, holeResults: [hole(1, 'par', 0, 'someone-else')] }),
    ]
    expect(
      deriveAchievements(noHarrington, COURSES, COUNTRIES).find((a) => a.id === 'harringtons-survival')?.isUnlocked,
    ).toBe(false)
  })

  it('unlocks "The Carnoustie Comeback" only for -4 or better at Carnoustie with Paul Lawrie in the bag', () => {
    const good = [round('carnoustie', { totalStrokesToPar: -4, holeResults: [hole(1, 'par', 0, 'sco-lawrie')] })]
    expect(deriveAchievements(good, COURSES, COUNTRIES).find((a) => a.id === 'lawrie-comeback')?.isUnlocked).toBe(true)

    const worse = [round('carnoustie', { totalStrokesToPar: -3, holeResults: [hole(1, 'par', 0, 'sco-lawrie')] })]
    expect(deriveAchievements(worse, COURSES, COUNTRIES).find((a) => a.id === 'lawrie-comeback')?.isUnlocked).toBe(
      false,
    )

    const noLawrie = [round('carnoustie', { totalStrokesToPar: -4, holeResults: [hole(1, 'par', 0, 'someone-else')] })]
    expect(
      deriveAchievements(noLawrie, COURSES, COUNTRIES).find((a) => a.id === 'lawrie-comeback')?.isUnlocked,
    ).toBe(false)
  })

  it('unlocks "Home Soil Hero" only for -7 or better at Valderrama with Sergio García in the bag', () => {
    const good = [round('valderrama', { totalStrokesToPar: -7, holeResults: [hole(1, 'par', 0, 'esp-garcia')] })]
    expect(deriveAchievements(good, COURSES, COUNTRIES).find((a) => a.id === 'garcia-home-soil')?.isUnlocked).toBe(
      true,
    )

    const worse = [round('valderrama', { totalStrokesToPar: -6, holeResults: [hole(1, 'par', 0, 'esp-garcia')] })]
    expect(deriveAchievements(worse, COURSES, COUNTRIES).find((a) => a.id === 'garcia-home-soil')?.isUnlocked).toBe(
      false,
    )
  })

  it('unlocks "Olympic Gold" only for -9 or better at Le Golf National with Scottie Scheffler in the bag', () => {
    const good = [
      round('le-golf-national', { totalStrokesToPar: -9, holeResults: [hole(1, 'par', 0, 'usa-scheffler')] }),
    ]
    expect(deriveAchievements(good, COURSES, COUNTRIES).find((a) => a.id === 'scheffler-gold')?.isUnlocked).toBe(
      true,
    )

    const worse = [
      round('le-golf-national', { totalStrokesToPar: -8, holeResults: [hole(1, 'par', 0, 'usa-scheffler')] }),
    ]
    expect(deriveAchievements(worse, COURSES, COUNTRIES).find((a) => a.id === 'scheffler-gold')?.isUnlocked).toBe(
      false,
    )
  })

  it('unlocks "The Iceman\'s Finale" only for 64-or-better gross at the Earth Course with Henrik Stenson in the bag', () => {
    const earthCourse: Course = { id: 'earth-course', name: 'earth-course', par: 72, holes: [] }
    const courses = [...COURSES, earthCourse]

    // Par 72: -8 to par = 64 gross, which does shoot 64 or under.
    const good = [
      round('earth-course', { totalStrokesToPar: -8, holeResults: [hole(1, 'par', 0, 'swe-stenson')] }),
    ]
    expect(deriveAchievements(good, courses, COUNTRIES).find((a) => a.id === 'stenson-finale')?.isUnlocked).toBe(
      true,
    )

    // -7 to par = 65 gross, which does NOT shoot 64 or under.
    const worse = [
      round('earth-course', { totalStrokesToPar: -7, holeResults: [hole(1, 'par', 0, 'swe-stenson')] }),
    ]
    expect(deriveAchievements(worse, courses, COUNTRIES).find((a) => a.id === 'stenson-finale')?.isUnlocked).toBe(
      false,
    )

    const noStenson = [
      round('earth-course', { totalStrokesToPar: -8, holeResults: [hole(1, 'par', 0, 'someone-else')] }),
    ]
    expect(
      deriveAchievements(noStenson, courses, COUNTRIES).find((a) => a.id === 'stenson-finale')?.isUnlocked,
    ).toBe(false)
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

  it('unlocks "An Off Day" for a round of +5 to par or worse', () => {
    const exactlyFive = [round('augusta', { totalStrokesToPar: 5 })]
    const worse = [round('augusta', { totalStrokesToPar: 9 })]
    const justUnder = [round('augusta', { totalStrokesToPar: 4 })]

    expect(deriveAchievements(exactlyFive, COURSES, COUNTRIES).find((a) => a.id === 'an-off-day')?.isUnlocked).toBe(
      true,
    )
    expect(deriveAchievements(worse, COURSES, COUNTRIES).find((a) => a.id === 'an-off-day')?.isUnlocked).toBe(true)
    expect(deriveAchievements(justUnder, COURSES, COUNTRIES).find((a) => a.id === 'an-off-day')?.isUnlocked).toBe(
      false,
    )
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

  it('unlocks "Miracle at Medinah" for a birdie by Ian Poulter on any of Medinah\'s final 5 holes', () => {
    for (const holeNumber of [14, 15, 16, 17, 18]) {
      const rounds = [round('medinah', { holeResults: [hole(holeNumber, 'birdie', -1, 'eng-poulter')] })]
      expect(
        deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'miracle-at-medinah')?.isUnlocked,
      ).toBe(true)
    }
  })

  it('does not unlock "Miracle at Medinah" for the wrong golfer, hole, course, or outcome', () => {
    const wrongGolfer = [round('medinah', { holeResults: [hole(18, 'birdie', -1, 'someone-else')] })]
    const wrongHole = [round('medinah', { holeResults: [hole(13, 'birdie', -1, 'eng-poulter')] })]
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

  it('unlocks "Spirit of Seve" for a birdie by any Spanish golfer on Brabazon hole 10', () => {
    const withSeve = [round('brabazon', { holeResults: [hole(10, 'birdie', -1, 'esp-ballesteros', 'spain')] })]
    expect(
      deriveAchievements(withSeve, COURSES, COUNTRIES).find((a) => a.id === 'spirit-of-seve')?.isUnlocked,
    ).toBe(true)

    // Any Spanish golfer counts, not just Seve specifically.
    const otherSpaniard = [round('brabazon', { holeResults: [hole(10, 'birdie', -1, 'esp-garcia', 'spain')] })]
    expect(
      deriveAchievements(otherSpaniard, COURSES, COUNTRIES).find((a) => a.id === 'spirit-of-seve')?.isUnlocked,
    ).toBe(true)
  })

  it('does not unlock "Spirit of Seve" for the wrong country, hole, course, or outcome', () => {
    const wrongCountry = [round('brabazon', { holeResults: [hole(10, 'birdie', -1, 'someone-else', 'usa')] })]
    const wrongHole = [round('brabazon', { holeResults: [hole(9, 'birdie', -1, 'esp-ballesteros', 'spain')] })]
    const wrongCourse = [round('augusta', { holeResults: [hole(10, 'birdie', -1, 'esp-ballesteros', 'spain')] })]
    const wrongOutcome = [round('brabazon', { holeResults: [hole(10, 'par', 0, 'esp-ballesteros', 'spain')] })]
    for (const rounds of [wrongCountry, wrongHole, wrongCourse, wrongOutcome]) {
      expect(
        deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'spirit-of-seve')?.isUnlocked,
      ).toBe(false)
    }
  })

  it('unlocks "The Cup Clincher" for a birdie by Rory McIlroy on Marco Simone hole 17', () => {
    const rounds = [round('marco-simone', { holeResults: [hole(17, 'birdie', -1, 'nir-mcilroy')] })]
    expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'cup-clincher')?.isUnlocked).toBe(
      true,
    )
  })

  it('does not unlock "The Cup Clincher" for the wrong golfer, hole, course, or outcome', () => {
    const wrongGolfer = [round('marco-simone', { holeResults: [hole(17, 'birdie', -1, 'someone-else')] })]
    const wrongHole = [round('marco-simone', { holeResults: [hole(16, 'birdie', -1, 'nir-mcilroy')] })]
    const wrongCourse = [round('augusta', { holeResults: [hole(17, 'birdie', -1, 'nir-mcilroy')] })]
    const wrongOutcome = [round('marco-simone', { holeResults: [hole(17, 'par', 0, 'nir-mcilroy')] })]
    for (const rounds of [wrongGolfer, wrongHole, wrongCourse, wrongOutcome]) {
      expect(deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'cup-clincher')?.isUnlocked).toBe(
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
      { name: 'Jack Nicklaus', achieved: true, current: 5, target: 5 },
      { name: 'Gary Player', achieved: true, current: 5, target: 5 },
      { name: 'Tiger Woods', achieved: true, current: 5, target: 5 },
      { name: 'Rory McIlroy', achieved: true, current: 5, target: 5 },
      { name: 'Ben Hogan', achieved: true, current: 5, target: 5 },
      { name: 'Gene Sarazen', achieved: false, current: 0, target: 5 },
    ])

    const allSixDone = [
      round('augusta', { holeResults: grandSlamIds.flatMap((id) => birdiesFor(id, 5)) }),
    ]
    const complete = deriveAchievements(allSixDone, COURSES, COUNTRIES).find((a) => a.id === 'grand-slam')
    expect(complete?.isUnlocked).toBe(true)
    expect(complete?.progress).toEqual({ current: 6, target: 6 })
    expect(complete?.roster?.every((entry) => entry.achieved)).toBe(true)
    expect(complete?.roster?.every((entry) => entry.current === 5 && entry.target === 5)).toBe(true)
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

  describe('Seasons tab', () => {
    function seasonRound(seasonId: string, roundNumber: number, overrides: Partial<RoundRecord> = {}) {
      return round('carnoustie', { seasonId, seasonRoundNumber: roundNumber, ...overrides })
    }

    it('unlocks "First Season" only once a season reaches all 16 rounds', () => {
      const fifteen = Array.from({ length: 15 }, (_, i) => seasonRound('s1', i + 1))
      const notYet = deriveAchievements(fifteen, COURSES, COUNTRIES).find((a) => a.id === 'first-season')
      expect(notYet?.isUnlocked).toBe(false)

      const sixteen = [...fifteen, seasonRound('s1', 16)]
      const done = deriveAchievements(sixteen, COURSES, COUNTRIES).find((a) => a.id === 'first-season')
      expect(done?.isUnlocked).toBe(true)
    })

    it('does not count untagged Free Play rounds toward "First Season"', () => {
      const freePlay = Array.from({ length: 16 }, () => round('carnoustie'))
      const result = deriveAchievements(freePlay, COURSES, COUNTRIES).find((a) => a.id === 'first-season')
      expect(result?.isUnlocked).toBe(false)
    })

    it('unlocks "First Major" only for a bogey-free round flagged isMajor', () => {
      const nonMajorBogeyFree = [round('augusta-national', { isMajor: false, isBogeyFreeRound: true })]
      expect(
        deriveAchievements(nonMajorBogeyFree, COURSES, COUNTRIES).find((a) => a.id === 'first-major')
          ?.isUnlocked,
      ).toBe(false)

      const majorNotBogeyFree = [round('augusta-national', { isMajor: true, isBogeyFreeRound: false })]
      expect(
        deriveAchievements(majorNotBogeyFree, COURSES, COUNTRIES).find((a) => a.id === 'first-major')
          ?.isUnlocked,
      ).toBe(false)

      const majorBogeyFree = [round('augusta-national', { isMajor: true, isBogeyFreeRound: true })]
      expect(
        deriveAchievements(majorBogeyFree, COURSES, COUNTRIES).find((a) => a.id === 'first-major')
          ?.isUnlocked,
      ).toBe(true)
    })

    it('unlocks "Major Slam" only once all 4 real major courses have a bogey-free round played as a season major', () => {
      function majorRound(courseId: string, seasonId: string) {
        return round(courseId, { seasonId, isMajor: true, isBogeyFreeRound: true })
      }
      const threeOfFour = [
        majorRound('augusta-national', 's1'),
        majorRound('royal-birkdale', 's1'),
        majorRound('pebble-beach', 's1'),
      ]
      const notYet = deriveAchievements(threeOfFour, COURSES, COUNTRIES).find((a) => a.id === 'major-slam')
      expect(notYet?.isUnlocked).toBe(false)
      expect(notYet?.progress).toEqual({ current: 3, target: 4 })

      const allFour = [...threeOfFour, majorRound('pinehurst-no-2', 's1')]
      const done = deriveAchievements(allFour, COURSES, COUNTRIES).find((a) => a.id === 'major-slam')
      expect(done?.isUnlocked).toBe(true)
      expect(done?.roster?.every((entry) => entry.achieved)).toBe(true)
    })

    it('does not count a bogey-free major-course round toward "Major Slam" unless it was played as a season major', () => {
      const freePlayBogeyFree = [
        round('augusta-national', { isBogeyFreeRound: true }), // untagged Free Play round
        round('royal-birkdale', { seasonId: 's1', isMajor: false, isBogeyFreeRound: true }), // season round, but not flagged as its major
        round('pebble-beach', { seasonId: 's1', isMajor: true, isBogeyFreeRound: false }), // season major, but not bogey-free
      ]
      const result = deriveAchievements(freePlayBogeyFree, COURSES, COUNTRIES).find(
        (a) => a.id === 'major-slam',
      )
      expect(result?.progress).toEqual({ current: 0, target: 4 })
    })

    it('unlocks "Back-to-Back" only once 2 separate completed seasons finish under par', () => {
      const season1 = Array.from({ length: 16 }, (_, i) => seasonRound('s1', i + 1, { totalStrokesToPar: -1 }))
      const oneSeason = deriveAchievements(season1, COURSES, COUNTRIES).find((a) => a.id === 'back-to-back')
      expect(oneSeason?.isUnlocked).toBe(false)
      expect(oneSeason?.progress).toEqual({ current: 1, target: 2 })

      const season2 = Array.from({ length: 16 }, (_, i) => seasonRound('s2', i + 1, { totalStrokesToPar: -1 }))
      const twoSeasons = deriveAchievements([...season1, ...season2], COURSES, COUNTRIES).find(
        (a) => a.id === 'back-to-back',
      )
      expect(twoSeasons?.isUnlocked).toBe(true)
    })

    it('does not count an over-par or incomplete season toward "Back-to-Back"', () => {
      const underPar = Array.from({ length: 16 }, (_, i) => seasonRound('s1', i + 1, { totalStrokesToPar: -1 }))
      const overPar = Array.from({ length: 16 }, (_, i) => seasonRound('s2', i + 1, { totalStrokesToPar: 1 }))
      const incomplete = Array.from({ length: 10 }, (_, i) => seasonRound('s3', i + 1, { totalStrokesToPar: -1 }))
      const result = deriveAchievements([...underPar, ...overPar, ...incomplete], COURSES, COUNTRIES).find(
        (a) => a.id === 'back-to-back',
      )
      expect(result?.progress).toEqual({ current: 1, target: 2 })
    })

    it('unlocks "All-Star Season" from a single season covering every legend, not a sum across seasons', () => {
      // Fixture has 6 legends: usa-nicklaus, usa-woods, usa-hogan, usa-sarazen, rsa-player, nir-mcilroy.
      const legendIds = ['usa-nicklaus', 'usa-woods', 'usa-hogan', 'usa-sarazen', 'rsa-player', 'nir-mcilroy']
      function draftHole(golferId: string) {
        return hole(1, 'par', 0, golferId)
      }

      // Split across two seasons, 3 legends each — neither season alone
      // covers all 6, so this should NOT unlock even though every legend
      // has been drafted somewhere in career history.
      const splitAcrossSeasons = [
        seasonRound('s1', 1, { holeResults: legendIds.slice(0, 3).map(draftHole) }),
        seasonRound('s2', 1, { holeResults: legendIds.slice(3).map(draftHole) }),
      ]
      const split = deriveAchievements(splitAcrossSeasons, COURSES, COUNTRIES).find(
        (a) => a.id === 'all-star-season',
      )
      expect(split?.isUnlocked).toBe(false)
      expect(split?.progress).toEqual({ current: 3, target: 6 })

      // All 6 within one season's rounds — unlocks.
      const oneSeason = [seasonRound('s3', 1, { holeResults: legendIds.map(draftHole) })]
      const result = deriveAchievements(oneSeason, COURSES, COUNTRIES).find((a) => a.id === 'all-star-season')
      expect(result?.isUnlocked).toBe(true)
      expect(result?.roster?.every((entry) => entry.achieved)).toBe(true)
    })
  })

  describe('Career: Full House and country Sweeps', () => {
    it('unlocks "Full House" only once every golfer in the fixture has been drafted at least once', () => {
      const allGolferIds = [
        'usa-nicklaus',
        'usa-woods',
        'usa-hogan',
        'usa-sarazen',
        'scrambler-golfer',
        'long-hitter-golfer',
        'golfer',
        'rsa-player',
        'nir-mcilroy',
      ]
      function draftHole(golferId: string) {
        return hole(1, 'par', 0, golferId)
      }

      const allButOne = [round('augusta', { holeResults: allGolferIds.slice(0, -1).map(draftHole) })]
      const notYet = deriveAchievements(allButOne, COURSES, COUNTRIES).find((a) => a.id === 'full-house')
      expect(notYet?.isUnlocked).toBe(false)
      expect(notYet?.progress).toEqual({ current: allGolferIds.length - 1, target: allGolferIds.length })

      const everyone = [round('augusta', { holeResults: allGolferIds.map(draftHole) })]
      const done = deriveAchievements(everyone, COURSES, COUNTRIES).find((a) => a.id === 'full-house')
      expect(done?.isUnlocked).toBe(true)
    })

    it('creates one "Sweep" achievement per country, unlocked once every one of that country\'s golfers has birdied or better', () => {
      const rsaSweepGolfers = deriveAchievements([], COURSES, COUNTRIES).find(
        (a) => a.id === 'birdie-country-rsa',
      )
      // Fixture's rsa country has exactly one golfer (Gary Player).
      expect(rsaSweepGolfers?.name).toBe('rsa Sweep')
      expect(rsaSweepGolfers?.roster).toEqual([{ name: 'Gary Player', achieved: false }])

      const rounds = [round('augusta', { holeResults: [hole(1, 'birdie', -1, 'rsa-player', 'rsa')] })]
      const result = deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'birdie-country-rsa')
      expect(result?.isUnlocked).toBe(true)
      expect(result?.roster).toEqual([{ name: 'Gary Player', achieved: true }])
    })

    it('does not unlock a country Sweep from a par (or worse) outcome, only birdie or better', () => {
      const rounds = [round('augusta', { holeResults: [hole(1, 'par', 0, 'rsa-player', 'rsa')] })]
      const result = deriveAchievements(rounds, COURSES, COUNTRIES).find((a) => a.id === 'birdie-country-rsa')
      expect(result?.isUnlocked).toBe(false)
    })
  })
})
