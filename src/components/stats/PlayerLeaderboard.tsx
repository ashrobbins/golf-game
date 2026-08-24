import { useMemo, useState } from 'react'
import type { Country, CountriesContent, Golfer, OutcomeTier } from '../../content/types'
import type { GolferRanking } from '../../game/stats/deriveStats'
import { CountryFlag } from '../picker/CountryFlag'
import { Button } from '../ui/Button'
import styles from './PlayerLeaderboard.module.css'

const TOP_COUNT = 5

interface PlayerLeaderboardProps {
  ranking: GolferRanking[]
  countries: CountriesContent
}

function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : String(points)
}

// Best-to-worst, matching every other outcome-tier ordering in the app
// (HoleOutcomeDots, ScorecardGrid). Drives both the breakdown's left-to-
// right order and which tiers get shown (zero-count tiers are skipped).
const TIER_BREAKDOWN_ORDER: OutcomeTier[] = ['hole_in_one', 'eagle', 'birdie', 'par', 'bogey_plus']

const TIER_BREAKDOWN_LABEL: Record<OutcomeTier, string> = {
  hole_in_one: 'HIO',
  eagle: 'Eagle',
  birdie: 'Birdie',
  par: 'Par',
  bogey_plus: 'Bogey+',
}

// Same 5-tier colour mapping as HoleOutcomeDots (eagle and birdie share the
// green "under par" colour there too) — keeps the breakdown chips reading
// consistently with the rest of the app's outcome-tier colour language.
const TIER_BREAKDOWN_CLASS: Record<OutcomeTier, string> = {
  hole_in_one: styles.tierAce,
  eagle: styles.tierBirdie,
  birdie: styles.tierBirdie,
  par: styles.tierPar,
  bogey_plus: styles.tierBogey,
}

function TierBreakdown({ tierCounts }: { tierCounts: GolferRanking['tierCounts'] }) {
  const entries = TIER_BREAKDOWN_ORDER.filter((tier) => tierCounts[tier] > 0)
  if (entries.length === 0) return null

  return (
    <div className={styles.breakdown}>
      {entries.map((tier) => (
        <span key={tier} className={`${styles.tierChip} ${TIER_BREAKDOWN_CLASS[tier]}`}>
          {tierCounts[tier]}× {TIER_BREAKDOWN_LABEL[tier]}
        </span>
      ))}
    </div>
  )
}

// Ranks career golfers by weighted hole outcomes (see rankGolfers /
// LEADERBOARD_MIN_HOLES_PLAYED in game/stats/deriveStats.ts for the scoring
// rules) — shows the top 5 by default with a toggle to reveal everyone
// who's cleared the minimum-holes-played bar.
export function PlayerLeaderboard({ ranking, countries }: PlayerLeaderboardProps) {
  const [showAll, setShowAll] = useState(false)

  const golferIndex = useMemo(() => {
    const map = new Map<string, Golfer>()
    for (const country of countries.countries) {
      for (const golfer of country.golfers) map.set(golfer.id, golfer)
    }
    return map
  }, [countries])

  const countryIndex = useMemo(() => {
    const map = new Map<string, Country>()
    for (const country of countries.countries) map.set(country.id, country)
    return map
  }, [countries])

  if (ranking.length === 0) {
    return (
      <p className={styles.empty}>
        Draft the same golfer across a few holes to start building a leaderboard.
      </p>
    )
  }

  const visible = showAll ? ranking : ranking.slice(0, TOP_COUNT)

  return (
    <>
      <ol className={styles.list}>
        {visible.map((entry, index) => {
          const golfer = golferIndex.get(entry.golferId)
          const country = countryIndex.get(entry.countryId)
          if (!golfer) return null

          const rowClasses = [styles.row, golfer.skill === 'legend' && styles.legend]
            .filter(Boolean)
            .join(' ')

          return (
            <li key={entry.golferId} className={rowClasses}>
              <div className={styles.rowHeader}>
                <span className={styles.rank}>{index + 1}</span>
                {country && (
                  <CountryFlag isoCode={country.isoCode} className={styles.flag} ariaHidden />
                )}
                <span className={styles.name}>{golfer.name}</span>
                <span className={styles.holes}>{entry.holesPlayed} holes</span>
                <span className={styles.points}>{formatPoints(entry.points)}</span>
              </div>
              <TierBreakdown tierCounts={entry.tierCounts} />
            </li>
          )
        })}
      </ol>
      {ranking.length > TOP_COUNT && (
        <Button variant="secondary" className={styles.toggle} onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show top 5' : `Show all ${ranking.length} players`}
        </Button>
      )}
    </>
  )
}
