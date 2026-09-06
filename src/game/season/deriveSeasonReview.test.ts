import { describe, expect, it } from 'vitest'
import type { CountriesContent, Country, Course, Golfer } from '../../content/types'
import type { RoundRecord } from '../stats/types'
import { deriveSeasonReview } from './deriveSeasonReview'
import type { CompletedSeason, SeasonRoundResult, SeasonScheduleEntry } from './types'

function golfer(id: string, name: string): Golfer {
  return { id, name, archetypes: ['closer'] }
}

function country(id: string, name: string, isoCode: string, golfers: Golfer[]): Country {
  return { id, name, isoCode, golfers }
}

const COUNTRIES: CountriesContent = {
  version: 1,
  countries: [
    country('usa', 'USA', 'US', [golfer('usa-woods', 'Tiger Woods'), golfer('usa-nicklaus', 'Jack Nicklaus')]),
    country('rsa', 'South Africa', 'ZA', [golfer('rsa-player', 'Gary Player')]),
  ],
}

const COURSES: Course[] = [
  {
    id: 'augusta-national',
    name: 'Augusta National',
    countryIsoCode: 'US',
    par: 72,
    holes: [{ number: 1, par: 4, yardage: 400, archetype: 'closer' }],
  },
  {
    id: 'carnoustie',
    name: 'Carnoustie',
    countryIsoCode: 'GB',
    par: 71,
    holes: [{ number: 1, par: 4, yardage: 410, archetype: 'closer' }],
  },
]

function hole(golferId: string, countryId: string, outcomeTier: RoundRecord['holeResults'][number]['outcomeTier']) {
  return { holeNumber: 1, golferId, countryId, outcomeTier, archetypeMatched: true, relativeScore: 0 }
}

function round(overrides: Partial<RoundRecord> = {}): RoundRecord {
  return {
    id: `round-${Math.random()}`,
    playedAt: '2026-01-01T00:00:00.000Z',
    courseId: 'augusta-national',
    holeResults: [],
    totalStrokesToPar: 0,
    bogeyFreeThroughHole: 18,
    isBogeyFreeRound: false,
    seasonId: 'season-a',
    ...overrides,
  }
}

function scheduleEntry(roundNumber: number, courseId: string, isMajor = false): SeasonScheduleEntry {
  return { roundNumber, courseId, isMajor }
}

function resultEntry(overrides: Partial<SeasonRoundResult> & { roundNumber: number }): SeasonRoundResult {
  return {
    courseId: 'augusta-national',
    isMajor: false,
    isBogeyFreeRound: false,
    totalStrokesToPar: 0,
    roundRecordId: `record-${overrides.roundNumber}`,
    ...overrides,
  }
}

function completedSeason(overrides: Partial<CompletedSeason> & { id: string; seasonNumber: number }): CompletedSeason {
  return {
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-02T00:00:00.000Z',
    schedule: [scheduleEntry(1, 'augusta-national', true), scheduleEntry(2, 'carnoustie')],
    results: [
      resultEntry({ roundNumber: 1, courseId: 'augusta-national', isMajor: true }),
      resultEntry({ roundNumber: 2, courseId: 'carnoustie' }),
    ],
    ...overrides,
  }
}

describe('deriveSeasonReview', () => {
  it('flags a bogey-free record when it beats every prior season', () => {
    const priorSeason = completedSeason({ id: 'season-a', seasonNumber: 1 })
    const currentSeason = completedSeason({ id: 'season-b', seasonNumber: 2 })
    const rounds = [
      round({ seasonId: 'season-a', isBogeyFreeRound: true }),
      round({ seasonId: 'season-a', isBogeyFreeRound: false }),
      round({ seasonId: 'season-b', isBogeyFreeRound: true }),
      round({ seasonId: 'season-b', isBogeyFreeRound: true }),
    ]
    const review = deriveSeasonReview(currentSeason, [priorSeason, currentSeason], rounds, COURSES, COUNTRIES)
    expect(review.bogeyFreeRounds).toBe(2)
    expect(review.priorBestBogeyFreeRounds).toBe(1)
    expect(review.isBogeyFreeRecord).toBe(true)
  })

  it('does not flag a record when a prior season already did better', () => {
    const priorSeason = completedSeason({ id: 'season-a', seasonNumber: 1 })
    const currentSeason = completedSeason({ id: 'season-b', seasonNumber: 2 })
    const rounds = [
      round({ seasonId: 'season-a', isBogeyFreeRound: true }),
      round({ seasonId: 'season-a', isBogeyFreeRound: true }),
      round({ seasonId: 'season-a', isBogeyFreeRound: true }),
      round({ seasonId: 'season-b', isBogeyFreeRound: true }),
    ]
    const review = deriveSeasonReview(currentSeason, [priorSeason, currentSeason], rounds, COURSES, COUNTRIES)
    expect(review.bogeyFreeRounds).toBe(1)
    expect(review.priorBestBogeyFreeRounds).toBe(3)
    expect(review.isBogeyFreeRecord).toBe(false)
  })

  it('treats a first season as a record when it has any bogey-free rounds', () => {
    const currentSeason = completedSeason({ id: 'season-a', seasonNumber: 1 })
    const rounds = [round({ seasonId: 'season-a', isBogeyFreeRound: true })]
    const review = deriveSeasonReview(currentSeason, [currentSeason], rounds, COURSES, COUNTRIES)
    expect(review.priorBestBogeyFreeRounds).toBe(0)
    expect(review.isBogeyFreeRecord).toBe(true)
  })

  it('does not flag a record when there are zero bogey-free rounds', () => {
    const currentSeason = completedSeason({ id: 'season-a', seasonNumber: 1 })
    const review = deriveSeasonReview(currentSeason, [currentSeason], [], COURSES, COUNTRIES)
    expect(review.bogeyFreeRounds).toBe(0)
    expect(review.isBogeyFreeRecord).toBe(false)
  })

  it('includes the previous season when seasonNumber - 1 exists in the archive', () => {
    const priorSeason = completedSeason({
      id: 'season-a',
      seasonNumber: 1,
      results: [
        resultEntry({ roundNumber: 1, totalStrokesToPar: -3 }),
        resultEntry({ roundNumber: 2, totalStrokesToPar: -1 }),
      ],
    })
    const currentSeason = completedSeason({ id: 'season-b', seasonNumber: 2 })
    const review = deriveSeasonReview(currentSeason, [priorSeason, currentSeason], [], COURSES, COUNTRIES)
    expect(review.previousSeason).toEqual({ seasonNumber: 1, totalStrokesToPar: -4 })
  })

  it('returns a null previousSeason for a first season', () => {
    const currentSeason = completedSeason({ id: 'season-a', seasonNumber: 1 })
    const review = deriveSeasonReview(currentSeason, [currentSeason], [], COURSES, COUNTRIES)
    expect(review.previousSeason).toBeNull()
  })

  it('selects the lowest-scoring round as bestRound and resolves its course', () => {
    const currentSeason = completedSeason({ id: 'season-a', seasonNumber: 1 })
    const rounds = [
      round({ seasonId: 'season-a', courseId: 'augusta-national', totalStrokesToPar: -2, isMajor: true, seasonRoundNumber: 1 }),
      round({ seasonId: 'season-a', courseId: 'carnoustie', totalStrokesToPar: -6, seasonRoundNumber: 2 }),
    ]
    const review = deriveSeasonReview(currentSeason, [currentSeason], rounds, COURSES, COUNTRIES)
    expect(review.bestRound).not.toBeNull()
    expect(review.bestRound?.courseId).toBe('carnoustie')
    expect(review.bestRound?.courseName).toBe('Carnoustie')
    expect(review.bestRound?.totalStrokesToPar).toBe(-6)
    expect(review.bestRound?.isMajor).toBe(false)
  })

  it('returns a null bestRound when the season has no recorded rounds', () => {
    const currentSeason = completedSeason({ id: 'season-a', seasonNumber: 1 })
    const review = deriveSeasonReview(currentSeason, [currentSeason], [], COURSES, COUNTRIES)
    expect(review.bestRound).toBeNull()
  })

  it('returns the top 5 players and top 3 nations, aggregated by points', () => {
    const currentSeason = completedSeason({ id: 'season-a', seasonNumber: 1 })
    const rounds = [
      round({
        seasonId: 'season-a',
        holeResults: [
          hole('usa-woods', 'usa', 'eagle'),
          hole('usa-nicklaus', 'usa', 'birdie'),
          hole('rsa-player', 'rsa', 'par'),
        ],
      }),
    ]
    const review = deriveSeasonReview(currentSeason, [currentSeason], rounds, COURSES, COUNTRIES)
    expect(review.topPlayers.map((p) => p.golferId)).toEqual(['usa-woods', 'usa-nicklaus', 'rsa-player'])
    expect(review.topPlayers.length).toBeLessThanOrEqual(5)
    expect(review.topNations).toEqual([
      { countryId: 'usa', name: 'USA', isoCode: 'US', points: 6 },
      { countryId: 'rsa', name: 'South Africa', isoCode: 'ZA', points: 1 },
    ])
  })

  it('classifies round-dot outcomes from schedule + results, including majors', () => {
    const currentSeason = completedSeason({
      id: 'season-a',
      seasonNumber: 1,
      schedule: [scheduleEntry(1, 'augusta-national', true), scheduleEntry(2, 'carnoustie', false)],
      results: [
        resultEntry({ roundNumber: 1, isMajor: true, totalStrokesToPar: -2 }),
        resultEntry({ roundNumber: 2, totalStrokesToPar: 1 }),
      ],
    })
    const review = deriveSeasonReview(currentSeason, [currentSeason], [], COURSES, COUNTRIES)
    expect(review.roundDots).toEqual([
      { roundNumber: 1, isMajor: true, outcome: 'under' },
      { roundNumber: 2, isMajor: false, outcome: 'over' },
    ])
  })
})
