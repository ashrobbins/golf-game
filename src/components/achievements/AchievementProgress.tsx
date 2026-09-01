import type { AchievementProgress as AchievementProgressData } from '../../game/achievements/deriveAchievements'
import styles from './AchievementProgress.module.css'

// Renders an achievement's optional {current, target} pair as an "X/Y"
// badge (e.g. "438/1,000") — a reusable building block for any achievement
// that tracks toward a numeric goal rather than unlocking in one round.
export function AchievementProgress({ current, target }: AchievementProgressData) {
  return (
    <span className={styles.badge}>
      {current.toLocaleString()}/{target.toLocaleString()}
    </span>
  )
}
