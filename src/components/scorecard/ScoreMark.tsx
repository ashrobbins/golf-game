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
}

// Standard golf-scorecard notation: circle for birdie, double circle for
// eagle, square for bogey-or-worse, filled gold circle for a hole-in-one.
// Shared between ScorecardGrid (the top hole-by-hole grid) and Scorecard's
// per-hole commentary list, so a given outcome always renders identically
// in both places.
export function ScoreMark({ gross, tier, className }: ScoreMarkProps) {
  const shapeClass = SHAPE_CLASS[tier]
  const classes = [styles.mark, shapeClass, className].filter(Boolean).join(' ')
  return <span className={classes}>{gross}</span>
}
