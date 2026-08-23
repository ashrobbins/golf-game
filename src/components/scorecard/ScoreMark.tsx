import type { OutcomeTier } from '../../content/types'
import styles from './ScoreMark.module.css'

// Par gets no shape — just the plain number, matching how it's always
// looked in the grid above.
const SHAPE_CLASS: Partial<Record<OutcomeTier, string>> = {
  hole_in_one: styles.holeInOne,
  eagle: styles.eagle,
  birdie: styles.birdie,
  bogey_plus: styles.bogeyPlus,
}

interface ScoreMarkProps {
  gross: number
  tier: OutcomeTier
  className?: string
  // 'large' is for the live reveal's current-hole spotlight card, where the
  // mark is the sole focal point rather than one of many in a grid/list.
  size?: 'default' | 'large'
}

// Standard golf-scorecard notation: circle for birdie, double circle for
// eagle, square for bogey-or-worse, filled gold circle for a hole-in-one.
// Shared between ScorecardGrid (the top hole-by-hole grid), the per-hole
// result rows, and the current-hole reveal card, so a given outcome always
// renders identically everywhere.
export function ScoreMark({ gross, tier, className, size = 'default' }: ScoreMarkProps) {
  const shapeClass = SHAPE_CLASS[tier]
  const classes = [styles.mark, size === 'large' && styles.large, shapeClass, className]
    .filter(Boolean)
    .join(' ')
  return <span className={classes}>{gross}</span>
}
