import type { SeasonRoundContext } from '../../state/GameContext'
import styles from './SeasonRoundBanner.module.css'

// Shown above every screen a season round passes through — course preview,
// draft, the live reveal, and the final results — so it's always clear
// which season/round you're in, especially for a major. Kept to one fixed
// width across all of them (matching the narrowest of those screens, the
// reveal sequence) rather than each page's own content width, so the
// banner reads as one consistent strip as you move through the round.
export function SeasonRoundBanner({ context }: { context: SeasonRoundContext }) {
  return (
    <div className={styles.row}>
      <span className={context.isMajor ? `${styles.pill} ${styles.major}` : styles.pill}>
        {context.isMajor && '🏆 '}
        Season {context.seasonNumber} · Round {context.roundNumber} of 16
        {context.isMajor && ' · Major'}
      </span>
    </div>
  )
}
