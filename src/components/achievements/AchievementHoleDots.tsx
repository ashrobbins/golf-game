import type { AchievementHoleProgressEntry } from '../../game/achievements/deriveAchievements'
import styles from './AchievementHoleDots.module.css'

// Renders an achievement's per-hole checklist as a row of small dots — a
// simpler two-state cousin of HoleOutcomeDots (scorecard/HoleOutcomeDots),
// reused for any achievement that requires the same thing on every hole of
// a course (e.g. Birdie All Holes), so progress is visible at a glance.
export function AchievementHoleDots({ holes }: { holes: AchievementHoleProgressEntry[] }) {
  return (
    <div className={styles.strip}>
      {holes.map((hole) => (
        <span
          key={hole.holeNumber}
          className={hole.achieved ? `${styles.dot} ${styles.achieved}` : styles.dot}
        />
      ))}
    </div>
  )
}
