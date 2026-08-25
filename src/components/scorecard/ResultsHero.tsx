import type { Hole } from '../../content/types'
import { formatBogeyFreeHeadline, formatRelativeScore } from '../../game/simulation/formatTier'
import type { HoleResult } from '../../game/simulation/types'
import { CountryFlag } from '../picker/CountryFlag'
import { HoleOutcomeDots } from './HoleOutcomeDots'
import styles from './ResultsHero.module.css'

interface ResultsHeroProps {
  courseName: string
  countryIsoCode?: string
  holes: Hole[]
  holeResults: HoleResult[]
  totalStrokesToPar: number
  bogeyFreeThroughHole: number
  isBogeyFreeRound: boolean
}

// Results-only hero — a split panel giving the bogey streak (the actual
// goal of the game) more visual weight than the score, unlike the live
// reveal's RoundHero, which leads with the score and is left untouched.
// On a full bogey-free round the whole card washes gold, reusing the same
// --tier-gold token the rest of the app's celebration treatment already
// uses (see Scorecard.tsx's Confetti trigger).
export function ResultsHero({
  courseName,
  countryIsoCode,
  holes,
  holeResults,
  totalStrokesToPar,
  bogeyFreeThroughHole,
  isBogeyFreeRound,
}: ResultsHeroProps) {
  return (
    <div className={isBogeyFreeRound ? `${styles.hero} ${styles.win}` : styles.hero}>
      <p className={styles.eyebrow}>
        {countryIsoCode && (
          <CountryFlag isoCode={countryIsoCode} className={styles.eyebrowFlag} ariaHidden />
        )}
        {courseName}
      </p>
      <div className={styles.panels}>
        <div className={styles.streakPanel}>
          <p className={styles.label}>Streak</p>
          <p className={styles.streakText}>
            {isBogeyFreeRound ? (
              <>
                <span aria-hidden>🏆 </span>Bogey-free for the entire round!
              </>
            ) : (
              formatBogeyFreeHeadline(bogeyFreeThroughHole, false, holes.length)
            )}
          </p>
        </div>
        <div className={styles.scorePanel}>
          <p className={styles.label}>Final Score</p>
          <p className={styles.scoreValue}>{formatRelativeScore(totalStrokesToPar)}</p>
        </div>
      </div>
      <div className={styles.dots}>
        <HoleOutcomeDots holes={holes} holeResults={holeResults} />
      </div>
    </div>
  )
}
