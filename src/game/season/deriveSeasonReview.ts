import type { CountriesContent, Course, Hole } from '../../content/types'
import { buildGolferIndex } from '../share/topPerformer'
import { findBestRound } from '../stats/deriveStats'
import type { HoleResult } from '../simulation/types'
import type { RoundRecord } from '../stats/types'
import { deriveSeasonStats } from './deriveSeasonStats'
import type { CompletedSeason } from './types'

const TOP_PLAYERS_COUNT = 5
const TOP_NATIONS_COUNT = 3

export interface SeasonReviewRoundDot {
  roundNumber: number
  isMajor: boolean
  outcome: 'under' | 'even' | 'over'
}

export interface SeasonReviewBestRound {
  courseId: string
  courseName: string
  countryIsoCode?: string
  isMajor: boolean
  roundNumber: number
  totalStrokesToPar: number
  holes: Hole[]
  holeResults: HoleResult[]
}

export interface SeasonReviewNation {
  countryId: string
  name: string
  isoCode: string
  points: number
}

export interface SeasonReviewPlayer {
  golferId: string
  name: string
  countryId: string
  isoCode: string
  points: number
}

export interface SeasonReview {
  seasonNumber: number
  totalStrokesToPar: number
  previousSeason: { seasonNumber: number; totalStrokesToPar: number } | null
  roundDots: SeasonReviewRoundDot[]
  bogeyFreeRounds: number
  isBogeyFreeRecord: boolean
  priorBestBogeyFreeRounds: number
  bestRound: SeasonReviewBestRound | null
  topPlayers: SeasonReviewPlayer[]
  topNations: SeasonReviewNation[]
}

function seasonTotal(season: CompletedSeason): number {
  return season.results.reduce((sum, r) => sum + r.totalStrokesToPar, 0)
}

function classifyOutcome(totalStrokesToPar: number): 'under' | 'even' | 'over' {
  if (totalStrokesToPar < 0) return 'under'
  if (totalStrokesToPar > 0) return 'over'
  return 'even'
}

// The one-stop derivation for the Season Review slideshow — both entry
// points (the final-round results page, and re-opening from Seasons
// History) call this instead of re-deriving stats independently. Built
// entirely from data other parts of the app already derive:
// deriveSeasonStats for bogey-free count + full points ranking,
// findBestRound for the season's standout round, and rankGolfers'
// existing per-golfer countryId for the nations podium.
export function deriveSeasonReview(
  season: CompletedSeason,
  allCompletedSeasons: CompletedSeason[],
  rounds: RoundRecord[],
  courses: Course[],
  countries: CountriesContent,
): SeasonReview {
  const otherSeasons = allCompletedSeasons.filter((s) => s.id !== season.id)

  const previousSeasonEntry = otherSeasons.find((s) => s.seasonNumber === season.seasonNumber - 1)
  const previousSeason = previousSeasonEntry
    ? { seasonNumber: previousSeasonEntry.seasonNumber, totalStrokesToPar: seasonTotal(previousSeasonEntry) }
    : null

  const roundDots: SeasonReviewRoundDot[] = season.schedule.map((entry) => {
    const result = season.results.find((r) => r.roundNumber === entry.roundNumber)
    return {
      roundNumber: entry.roundNumber,
      isMajor: entry.isMajor,
      outcome: result ? classifyOutcome(result.totalStrokesToPar) : 'even',
    }
  })

  const { bogeyFreeRounds, ranking } = deriveSeasonStats(season.id, rounds, countries)

  const priorBestBogeyFreeRounds = otherSeasons.reduce((best, s) => {
    const count = deriveSeasonStats(s.id, rounds, countries).bogeyFreeRounds
    return count > best ? count : best
  }, 0)
  const isBogeyFreeRecord = bogeyFreeRounds > 0 && bogeyFreeRounds >= priorBestBogeyFreeRounds

  const seasonRounds = rounds.filter((r) => r.seasonId === season.id)
  const bestRoundRecord = findBestRound(seasonRounds)
  const courseIndex = new Map(courses.map((c) => [c.id, c]))
  const bestRoundCourse = bestRoundRecord ? courseIndex.get(bestRoundRecord.courseId) : undefined
  const bestRound: SeasonReviewBestRound | null =
    bestRoundRecord && bestRoundCourse
      ? {
          courseId: bestRoundCourse.id,
          courseName: bestRoundCourse.name,
          countryIsoCode: bestRoundCourse.countryIsoCode,
          isMajor: Boolean(bestRoundRecord.isMajor),
          roundNumber: bestRoundRecord.seasonRoundNumber ?? 0,
          totalStrokesToPar: bestRoundRecord.totalStrokesToPar,
          holes: bestRoundCourse.holes,
          holeResults: bestRoundRecord.holeResults,
        }
      : null

  const countryIndex = new Map(countries.countries.map((c) => [c.id, c]))
  const golferIndex = buildGolferIndex(countries)

  const nationTotals = new Map<string, number>()
  for (const entry of ranking) {
    nationTotals.set(entry.countryId, (nationTotals.get(entry.countryId) ?? 0) + entry.points)
  }
  const topNations: SeasonReviewNation[] = Array.from(nationTotals.entries())
    .map(([countryId, points]) => {
      const country = countryIndex.get(countryId)
      return country ? { countryId, name: country.name, isoCode: country.isoCode, points } : null
    })
    .filter((nation): nation is SeasonReviewNation => nation !== null)
    .sort((a, b) => b.points - a.points)
    .slice(0, TOP_NATIONS_COUNT)

  const topPlayers: SeasonReviewPlayer[] = ranking.slice(0, TOP_PLAYERS_COUNT).map((entry) => {
    const golfer = golferIndex.get(entry.golferId)
    const country = countryIndex.get(entry.countryId)
    return {
      golferId: entry.golferId,
      name: golfer?.name ?? entry.golferId,
      countryId: entry.countryId,
      isoCode: country?.isoCode ?? '',
      points: entry.points,
    }
  })

  return {
    seasonNumber: season.seasonNumber,
    totalStrokesToPar: seasonTotal(season),
    previousSeason,
    roundDots,
    bogeyFreeRounds,
    isBogeyFreeRecord,
    priorBestBogeyFreeRounds,
    bestRound,
    topPlayers,
    topNations,
  }
}
