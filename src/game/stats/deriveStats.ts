import type { OutcomeTier } from '../../content/types'
import type { RoundRecord } from './types'

function countTier(round: RoundRecord, tier: OutcomeTier): number {
  return round.holeResults.filter((hole) => hole.outcomeTier === tier).length
}

export function bogeyFreeRoundCount(rounds: RoundRecord[]): number {
  return rounds.filter((round) => round.isBogeyFreeRound).length
}

export function careerTierCount(rounds: RoundRecord[], tier: OutcomeTier): number {
  return rounds.reduce((sum, round) => sum + countTier(round, tier), 0)
}

// Points per hole outcome for the golfer leaderboard/top-player stat below —
// chosen so a single eagle (4) always outweighs two pars (1+1), and a
// bogey+ actively costs a golfer points rather than just sitting neutral.
const TIER_POINTS: Record<OutcomeTier, number> = {
  hole_in_one: 8,
  eagle: 4,
  birdie: 2,
  par: 1,
  bogey_plus: -1,
}

// Golfers need at least this many holes played (across every round in the
// set being ranked) before they're eligible for a leaderboard/top-player
// slot, so one lucky hole in a single appearance can't outrank someone with
// a longer, solid track record.
export const LEADERBOARD_MIN_HOLES_PLAYED = 3

function emptyTierCounts(): Record<OutcomeTier, number> {
  return { hole_in_one: 0, eagle: 0, birdie: 0, par: 0, bogey_plus: 0 }
}

export interface GolferRanking {
  golferId: string
  countryId: string
  points: number
  holesPlayed: number
  // How that points total breaks down by outcome tier — powers the "why is
  // this golfer ranked here" breakdown in the leaderboard UI.
  tierCounts: Record<OutcomeTier, number>
}

export function rankGolfers(
  rounds: RoundRecord[],
  minHolesPlayed = LEADERBOARD_MIN_HOLES_PLAYED,
): GolferRanking[] {
  const totals = new Map<string, GolferRanking>()

  for (const round of rounds) {
    for (const hole of round.holeResults) {
      const points = TIER_POINTS[hole.outcomeTier]
      const existing = totals.get(hole.golferId)
      if (existing) {
        existing.points += points
        existing.holesPlayed += 1
        existing.tierCounts[hole.outcomeTier] += 1
      } else {
        const tierCounts = emptyTierCounts()
        tierCounts[hole.outcomeTier] = 1
        totals.set(hole.golferId, {
          golferId: hole.golferId,
          countryId: hole.countryId,
          points,
          holesPlayed: 1,
          tierCounts,
        })
      }
    }
  }

  return Array.from(totals.values())
    .filter((golfer) => golfer.holesPlayed >= minHolesPlayed)
    .sort(
      (a, b) =>
        b.points - a.points || b.holesPlayed - a.holesPlayed || a.golferId.localeCompare(b.golferId),
    )
}

export interface DerivedStats {
  roundsPlayed: number
  bogeyFreeRounds: number
  // Highest-points golfer (same ranking/threshold as the career leaderboard
  // below), scoped to whatever round set was passed in — null until someone
  // clears LEADERBOARD_MIN_HOLES_PLAYED within that set.
  topGolfer: GolferRanking | null
  totalBirdieCount: number
  totalEagleCount: number
  holeInOnes: number
}

export function deriveStats(rounds: RoundRecord[]): DerivedStats {
  return {
    roundsPlayed: rounds.length,
    bogeyFreeRounds: bogeyFreeRoundCount(rounds),
    topGolfer: rankGolfers(rounds)[0] ?? null,
    totalBirdieCount: careerTierCount(rounds, 'birdie'),
    totalEagleCount: careerTierCount(rounds, 'eagle'),
    holeInOnes: careerTierCount(rounds, 'hole_in_one'),
  }
}

export function deriveStatsForCourse(rounds: RoundRecord[], courseId: string): DerivedStats {
  return deriveStats(rounds.filter((round) => round.courseId === courseId))
}
