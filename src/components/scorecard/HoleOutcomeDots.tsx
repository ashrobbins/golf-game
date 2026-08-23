import type { Hole, OutcomeTier } from '../../content/types'
import type { HoleResult } from '../../game/simulation/types'
import styles from './HoleOutcomeDots.module.css'

const DOT_CLASS: Record<OutcomeTier, string> = {
  hole_in_one: styles.ace,
  eagle: styles.birdie,
  birdie: styles.birdie,
  par: styles.par,
  bogey_plus: styles.bogey,
}

interface HoleOutcomeDotsProps {
  holes: Hole[]
  holeResults: HoleResult[]
  // Holes to render as scored; the rest render as not-yet-played. Defaults
  // to fully revealed, matching ScorecardGrid's own convention.
  revealedCount?: number
}

// Replaces what would otherwise be a plain progress bar during the live
// reveal — one dot per hole, colored by outcome tier once revealed. Reused
// as-is on the final results screen with every hole already revealed.
export function HoleOutcomeDots({ holes, holeResults, revealedCount }: HoleOutcomeDotsProps) {
  const revealed = revealedCount ?? holeResults.length

  return (
    <div className={styles.strip}>
      {holes.map((hole, i) => {
        const result = i < revealed ? holeResults[i] : undefined
        const dotClass = result ? DOT_CLASS[result.outcomeTier] : undefined
        return <span key={hole.number} className={[styles.dot, dotClass].filter(Boolean).join(' ')} />
      })}
    </div>
  )
}
