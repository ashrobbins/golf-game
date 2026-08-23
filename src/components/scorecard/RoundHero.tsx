import type { Hole } from '../../content/types'
import { formatBogeyFreeHeadline, formatRelativeScore } from '../../game/simulation/formatTier'
import type { HoleResult } from '../../game/simulation/types'
import { HoleOutcomeDots } from './HoleOutcomeDots'
import styles from './RoundHero.module.css'

interface RoundHeroProps {
  courseName: string
  holes: Hole[]
  holeResults: HoleResult[]
  // Holes to summarize; the rest are treated as not-yet-played. Defaults to
  // the full round, matching ScorecardGrid/HoleOutcomeDots' own convention.
  revealedCount?: number
}

// Shared hero stat card for both the live reveal and final results screens
// — total-to-par, bogey-free streak, and the 18-dot outcome strip, derived
// from whatever's been revealed so far so the same component works for a
// partial round in progress and a finished one.
export function RoundHero({ courseName, holes, holeResults, revealedCount }: RoundHeroProps) {
  const revealed = holeResults.slice(0, revealedCount ?? holeResults.length)
  const totalStrokesToPar = revealed.reduce((sum, r) => sum + r.relativeScore, 0)
  const firstBogeyIndex = revealed.findIndex((r) => r.outcomeTier === 'bogey_plus')
  const bogeyFreeThroughHole = firstBogeyIndex === -1 ? revealed.length : firstBogeyIndex
  const isBogeyFreeRound = firstBogeyIndex === -1 && revealed.length > 0 && revealed.length === holes.length

  return (
    <div className={styles.hero}>
      <p className={styles.label}>{courseName} · Total</p>
      <p className={styles.score}>{revealed.length > 0 ? formatRelativeScore(totalStrokesToPar) : '–'}</p>
      <span className={isBogeyFreeRound ? `${styles.chip} ${styles.chipCelebratory}` : styles.chip}>
        {isBogeyFreeRound && <span aria-hidden>🏆 </span>}
        {formatBogeyFreeHeadline(bogeyFreeThroughHole, isBogeyFreeRound, holes.length)}
      </span>
      <HoleOutcomeDots holes={holes} holeResults={holeResults} revealedCount={revealedCount} />
    </div>
  )
}
