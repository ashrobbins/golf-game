import type { AchievementHoleProgressEntry } from '../../game/achievements/deriveAchievements'
import styles from './AchievementHoleDots.module.css'

// Renders an achievement's per-hole checklist as a row of hole numbers,
// coloured green/grey — reused for any achievement that requires the same
// thing on every hole of a course (e.g. Birdie All Holes), so it's obvious
// at a glance not just how much progress there is, but which holes remain.
export function AchievementHoleDots({ holes }: { holes: AchievementHoleProgressEntry[] }) {
  return (
    <div className={styles.strip}>
      {holes.map((hole) => (
        <span
          key={hole.holeNumber}
          className={hole.achieved ? `${styles.num} ${styles.achieved}` : styles.num}
        >
          {hole.holeNumber}
        </span>
      ))}
    </div>
  )
}
