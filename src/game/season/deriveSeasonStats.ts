import type { CountriesContent } from '../../content/types'
import { buildGolferIndex } from '../share/topPerformer'
import { rankGolfers } from '../stats/deriveStats'
import type { GolferRanking } from '../stats/deriveStats'
import type { RoundRecord } from '../stats/types'

export interface SeasonStats {
  topPerformer: { golferId: string; name: string } | null
  bogeyFreeRounds: number
  // Full points ranking for the season (not just the #1 entry) — powers the
  // tappable "Top performer" -> top-5 leaderboard drawer.
  ranking: GolferRanking[]
}

// Deliberately reuses the same points-based ranking the career leaderboard
// uses (rankGolfers), just scoped to one season's rounds — rather than a
// separate "most bogey-free holes" metric, so a single eagle still
// outweighs two pars the same way it does everywhere else in the app. A
// minHolesPlayed of 0 (vs. the leaderboard's usual 3) is deliberate too:
// a season is a small enough sample that requiring 3+ holes would leave
// early rounds with no "top performer" at all.
export function deriveSeasonStats(
  seasonId: string,
  rounds: RoundRecord[],
  countries: CountriesContent,
): SeasonStats {
  const seasonRounds = rounds.filter((r) => r.seasonId === seasonId)
  const bogeyFreeRounds = seasonRounds.filter((r) => r.isBogeyFreeRound).length

  const ranking = rankGolfers(seasonRounds, 0)
  const topRanking = ranking[0]
  if (!topRanking) {
    return { topPerformer: null, bogeyFreeRounds, ranking }
  }

  const golferIndex = buildGolferIndex(countries)
  return {
    topPerformer: {
      golferId: topRanking.golferId,
      name: golferIndex.get(topRanking.golferId)?.name ?? topRanking.golferId,
    },
    bogeyFreeRounds,
    ranking,
  }
}
