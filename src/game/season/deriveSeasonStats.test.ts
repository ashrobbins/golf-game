import { describe, expect, it } from 'vitest'
import type { CountriesContent, Country, Golfer } from '../../content/types'
import type { RoundRecord } from '../stats/types'
import { deriveSeasonStats } from './deriveSeasonStats'

function golfer(id: string, name: string): Golfer {
  return { id, name, archetypes: ['closer'] }
}

function country(id: string, golfers: Golfer[]): Country {
  return { id, name: id, isoCode: 'US', golfers }
}

const COUNTRIES: CountriesContent = {
  version: 1,
  countries: [country('usa', [golfer('usa-woods', 'Tiger Woods'), golfer('usa-nicklaus', 'Jack Nicklaus')])],
}

function hole(golferId: string, outcomeTier: RoundRecord['holeResults'][number]['outcomeTier']) {
  return { holeNumber: 1, golferId, countryId: 'usa', outcomeTier, archetypeMatched: true, relativeScore: 0 }
}

function round(overrides: Partial<RoundRecord> = {}): RoundRecord {
  return {
    id: `round-${Math.random()}`,
    playedAt: '2026-01-01T00:00:00.000Z',
    courseId: 'carnoustie',
    holeResults: [],
    totalStrokesToPar: 0,
    bogeyFreeThroughHole: 18,
    isBogeyFreeRound: false,
    seasonId: 'season-1',
    ...overrides,
  }
}

describe('deriveSeasonStats', () => {
  it('only considers rounds tagged with the given seasonId', () => {
    const rounds = [
      round({ isBogeyFreeRound: true }),
      round({ seasonId: 'season-2', isBogeyFreeRound: true }),
      round({ seasonId: undefined, isBogeyFreeRound: true }),
    ]
    const stats = deriveSeasonStats('season-1', rounds, COUNTRIES)
    expect(stats.bogeyFreeRounds).toBe(1)
  })

  it('counts bogey-free rounds within the season', () => {
    const rounds = [
      round({ isBogeyFreeRound: true }),
      round({ isBogeyFreeRound: true }),
      round({ isBogeyFreeRound: false }),
    ]
    expect(deriveSeasonStats('season-1', rounds, COUNTRIES).bogeyFreeRounds).toBe(2)
  })

  it('picks the top performer by points, even with no leaderboard-style holes-played minimum', () => {
    const rounds = [
      round({ holeResults: [hole('usa-woods', 'birdie')] }),
      round({ holeResults: [hole('usa-nicklaus', 'par')] }),
    ]
    const stats = deriveSeasonStats('season-1', rounds, COUNTRIES)
    expect(stats.topPerformer).toEqual({ golferId: 'usa-woods', name: 'Tiger Woods' })
  })

  it('returns a null top performer when the season has no rounds yet', () => {
    const stats = deriveSeasonStats('season-1', [], COUNTRIES)
    expect(stats.topPerformer).toBeNull()
    expect(stats.bogeyFreeRounds).toBe(0)
  })
})
